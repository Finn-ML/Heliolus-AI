# Assessment Risk Generation Fix

## Problem

Assessment execution was failing when questions in the template didn't have a `categoryTag` field populated. This caused:

- 0 risks to be generated
- Assessment marked as FAILED
- Frontend error when trying to display results page
- User unable to complete assessment journey

## Root Cause

The `generateRisksFromAnswers()` method in `assessment.service.ts` (line 1391) required questions to have a `categoryTag` field:

```typescript
if (question && question.categoryTag) {
  // Only questions with categoryTag were processed
  // Result: categoryScores Map stayed empty if no categoryTag
}
```

Meanwhile, the `generateGapsFromAnswers()` method (line 1275) had proper fallback logic:

```typescript
category: question.categoryTag || question.section.title,
```

This discrepancy meant gaps were generated successfully (24 gaps), but risks failed (0 risks).

## Solution

Enhanced `generateRisksFromAnswers()` with three improvements:

### 1. Added Fallback Category Logic

```typescript
const question = await this.prisma.question.findUnique({
  where: { id: answer.questionId },
  include: { section: true }, // Include section for fallback
});

if (question) {
  // Use categoryTag if available, otherwise fall back to section title
  const category = question.categoryTag || question.section?.title || 'General Compliance';
  // Process all questions, not just those with categoryTag
}
```

### 2. Added Safety Net

If no category-specific risks are generated but there are low-scoring answers, create at least one general operational risk:

```typescript
if (risks.length === 0 && answers.length > 0) {
  const overallAvgScore = answers.reduce((sum, a) => sum + a.score, 0) / answers.length;

  if (overallAvgScore < 3) {
    risks.push({
      category: RiskCategory.OPERATIONAL,
      title: 'General Compliance Risk',
      description: `Assessment indicates compliance gaps requiring attention. Average score: ${overallAvgScore.toFixed(1)}/5`,
      likelihood: overallAvgScore < 2 ? Likelihood.LIKELY : Likelihood.POSSIBLE,
      impact: overallAvgScore < 2 ? Impact.MAJOR : Impact.MODERATE,
      riskLevel: overallAvgScore < 2 ? RiskLevel.HIGH : RiskLevel.MEDIUM,
      mitigationStrategy: 'Review low-scoring areas and implement appropriate remediation measures',
    });
  }
}
```

### 3. Added Logging

Log when the safety net is triggered to help with debugging:

```typescript
this.logger.info('No category-specific risks generated, creating general operational risk', {
  assessmentId,
  overallAvgScore,
  answerCount: answers.length,
});
```

## Benefits

1. **Resilient**: Assessments complete successfully even without categoryTag on questions
2. **Consistent**: Risk generation now matches gap generation logic
3. **User-friendly**: Users can always view results page after assessment
4. **Backward compatible**: Existing assessments with categoryTag continue to work as before
5. **Debuggable**: Logging helps identify when fallback logic is used

## Testing

To verify the fix:

1. Run an assessment with a template where questions don't have categoryTag
2. Check that assessment completes with COMPLETED status (not FAILED)
3. Verify risks are generated based on section titles
4. Confirm results page loads successfully
5. Check backend logs for the fallback logging message if applicable

## Files Modified

- `/home/runner/workspace/backend/src/services/assessment.service.ts` (lines 1527-1595)

## Impact

- **Low risk**: Changes only affect risk generation logic
- **High value**: Fixes critical issue blocking assessment completion
- **No breaking changes**: Backward compatible with existing data

## Related Issues

- User report: "after I submitted answers for the question gaps the page did not proceed to the report. it errored and reloaded the page"
- Assessment cmgp82p3 failed with 0 risks generated
- Gap generation working correctly (24 gaps generated)

---

**Fix Applied**: October 13, 2025
**Tested**: Pending backend restart and new assessment execution
