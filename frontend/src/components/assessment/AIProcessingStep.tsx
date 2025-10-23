import { useEffect, useState, useCallback } from 'react';
import { assessmentApi } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Brain, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface AIProcessingStepProps {
  assessmentId: string;
  onComplete: () => void;
  onError: (error: Error) => void;
}

interface ProgressData {
  assessmentId: string;
  status: string;
  progress: {
    totalQuestions: number;
    processedQuestions: number;
    successfulAnalyses: number;
    failedAnalyses: number;
    currentQuestion?: {
      id: string;
      text: string;
      sectionName: string;
    };
  };
  answers: Array<{
    id: string;
    questionId: string;
    status: string;
    response?: string;
    evidenceTier?: string;
    aiScore?: number;
    aiExplanation?: string;
  }>;
}

export function AIProcessingStep({ assessmentId, onComplete, onError }: AIProcessingStepProps) {
  const [progressData, setProgressData] = useState<ProgressData | null>(null);
  const [isExecuting, setIsExecuting] = useState(false);
  const [showInputDialog, setShowInputDialog] = useState(false);
  const [userAnswer, setUserAnswer] = useState('');
  const [currentPausedQuestion, setCurrentPausedQuestion] = useState<{
    id: string;
    text: string;
    sectionName: string;
  } | null>(null);

  // Poll for progress updates
  const pollProgress = useCallback(async () => {
    try {
      const data = await assessmentApi.getAssessmentProgress(assessmentId);
      setProgressData(data);

      console.log('[AIProcessing] Progress update:', data);

      // Check if we need to pause for user input
      // If AI status is PENDING_USER_INPUT (you might need to add this status)
      // or if there are failed analyses that need user input
      if (data.status === 'PAUSED' || data.progress.currentQuestion) {
        const unansweredQuestion = data.answers.find(a => a.status === 'PENDING_USER_INPUT');

        if (unansweredQuestion && data.progress.currentQuestion) {
          setCurrentPausedQuestion(data.progress.currentQuestion);
          setShowInputDialog(true);
        }
      }

      // Check if processing is complete
      if (data.status === 'COMPLETED') {
        setIsExecuting(false);
        setTimeout(() => onComplete(), 1500); // Small delay to show completion state
      }

      // Check if processing failed
      if (data.status === 'FAILED') {
        setIsExecuting(false);
        onError(new Error('Assessment processing failed'));
      }
    } catch (error) {
      console.error('[AIProcessing] Error polling progress:', error);
      onError(error as Error);
    }
  }, [assessmentId, onComplete, onError]);

  // Start assessment execution
  useEffect(() => {
    const startExecution = async () => {
      setIsExecuting(true);
      try {
        console.log('[AIProcessing] Starting assessment execution...');
        await assessmentApi.executeAssessment(assessmentId);
        console.log('[AIProcessing] Execution started successfully');
      } catch (error) {
        console.error('[AIProcessing] Error starting execution:', error);
        onError(error as Error);
      }
    };

    startExecution();
  }, [assessmentId, onError]);

  // Poll for progress while executing
  useEffect(() => {
    if (!isExecuting) return;

    const intervalId = setInterval(pollProgress, 2000); // Poll every 2 seconds

    return () => clearInterval(intervalId);
  }, [isExecuting, pollProgress]);

  // Handle user answer submission
  const handleSubmitAnswer = async () => {
    if (!currentPausedQuestion || !userAnswer.trim()) return;

    try {
      console.log('[AIProcessing] Submitting user answer for question:', currentPausedQuestion.id);

      // Find the answer ID for this question
      const answer = progressData?.answers.find(a => a.questionId === currentPausedQuestion.id);

      if (answer) {
        // Update the answer with user's response
        await assessmentApi.updateAnswer(answer.id, {
          response: userAnswer,
          status: 'COMPLETED',
          evidenceTier: 'TIER_0', // Self-declared since manually entered
        });

        console.log('[AIProcessing] Answer submitted successfully');

        // Clear dialog state
        setShowInputDialog(false);
        setUserAnswer('');
        setCurrentPausedQuestion(null);

        // Resume processing by polling again
        pollProgress();
      }
    } catch (error) {
      console.error('[AIProcessing] Error submitting answer:', error);
      onError(error as Error);
    }
  };

  const progressPercentage = progressData
    ? (progressData.progress.processedQuestions / progressData.progress.totalQuestions) * 100
    : 0;

  return (
    <div className="space-y-8 py-8">
      {/* Header */}
      <div className="text-center space-y-2">
        <div className="flex justify-center">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
          >
            <Brain className="h-16 w-16 text-primary" />
          </motion.div>
        </div>
        <h2 className="text-3xl font-bold">AI Analysis in Progress</h2>
        <p className="text-muted-foreground">
          Our AI is analyzing your documents and answering questions automatically
        </p>
      </div>

      {/* Progress Bar */}
      <div className="space-y-2">
        <div className="flex justify-between text-sm">
          <span className="font-medium">
            Processing Questions: {progressData?.progress.processedQuestions || 0} /{' '}
            {progressData?.progress.totalQuestions || 0}
          </span>
          <span className="text-muted-foreground">{Math.round(progressPercentage)}%</span>
        </div>
        <Progress value={progressPercentage} className="h-3" />
      </div>

      {/* Current Question Display */}
      <AnimatePresence mode="wait">
        {progressData?.progress.currentQuestion && (
          <motion.div
            key={progressData.progress.currentQuestion.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="rounded-lg border bg-card p-6 space-y-3"
          >
            <div className="flex items-start gap-3">
              <Loader2 className="h-5 w-5 text-primary animate-spin mt-1" />
              <div className="flex-1 space-y-1">
                <p className="text-sm font-medium text-muted-foreground">
                  {progressData.progress.currentQuestion.sectionName}
                </p>
                <p className="text-base font-medium">
                  {progressData.progress.currentQuestion.text}
                </p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-4">
        <div className="rounded-lg border bg-card p-4 space-y-1">
          <div className="flex items-center gap-2 text-green-600">
            <CheckCircle2 className="h-4 w-4" />
            <span className="text-sm font-medium">Successful</span>
          </div>
          <p className="text-2xl font-bold">{progressData?.progress.successfulAnalyses || 0}</p>
        </div>

        <div className="rounded-lg border bg-card p-4 space-y-1">
          <div className="flex items-center gap-2 text-amber-600">
            <AlertCircle className="h-4 w-4" />
            <span className="text-sm font-medium">Needs Input</span>
          </div>
          <p className="text-2xl font-bold">{progressData?.progress.failedAnalyses || 0}</p>
        </div>
      </div>

      {/* Processing Status Messages */}
      <div className="rounded-lg bg-muted/50 p-4">
        <div className="space-y-2">
          <p className="text-sm text-muted-foreground">
            <strong>What's happening:</strong>
          </p>
          <ul className="text-sm space-y-1 text-muted-foreground list-disc list-inside">
            <li>Analyzing uploaded documents for relevant information</li>
            <li>Cross-referencing answers with compliance frameworks</li>
            <li>Generating evidence-backed responses</li>
            <li>Identifying questions that need your expertise</li>
          </ul>
        </div>
      </div>

      {/* Completion State */}
      {progressData?.status === 'COMPLETED' && (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="rounded-lg border-2 border-green-500 bg-green-50 dark:bg-green-950 p-6 text-center space-y-2"
        >
          <CheckCircle2 className="h-12 w-12 text-green-600 mx-auto" />
          <h3 className="text-xl font-semibold text-green-900 dark:text-green-100">
            Analysis Complete!
          </h3>
          <p className="text-sm text-green-700 dark:text-green-300">
            Processing your results and preparing your assessment...
          </p>
        </motion.div>
      )}

      {/* User Input Dialog */}
      <Dialog open={showInputDialog} onOpenChange={setShowInputDialog}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-amber-500" />
              AI Needs Your Input
            </DialogTitle>
            <DialogDescription>
              Our AI couldn't find sufficient information in your documents to answer this question.
              Please provide your answer manually.
            </DialogDescription>
          </DialogHeader>

          {currentPausedQuestion && (
            <div className="space-y-4">
              <div className="rounded-lg border bg-muted/50 p-4 space-y-2">
                <p className="text-xs font-medium text-muted-foreground">
                  {currentPausedQuestion.sectionName}
                </p>
                <p className="text-sm font-medium">{currentPausedQuestion.text}</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="user-answer">Your Answer</Label>
                <Textarea
                  id="user-answer"
                  placeholder="Enter your answer here..."
                  value={userAnswer}
                  onChange={e => setUserAnswer(e.target.value)}
                  rows={6}
                  className="resize-none"
                />
                <p className="text-xs text-muted-foreground">
                  This will be marked as self-declared (Tier 0) evidence
                </p>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowInputDialog(false);
                setUserAnswer('');
              }}
            >
              Skip Question
            </Button>
            <Button onClick={handleSubmitAnswer} disabled={!userAnswer.trim()}>
              Submit & Continue
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
