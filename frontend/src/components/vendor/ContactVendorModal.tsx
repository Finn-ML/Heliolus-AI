import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Send, Loader2, X, DollarSign, Calendar, FileText } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { useContactVendor, ContactType } from '@/hooks/useContactVendor';
import { useToast } from '@/hooks/use-toast';

const contactFormSchema = z.object({
  type: z.enum(['DEMO_REQUEST', 'INFO_REQUEST', 'RFP', 'PRICING', 'GENERAL'], {
    required_error: 'Please select a contact type',
  }),
  message: z
    .string()
    .min(10, 'Message must be at least 10 characters')
    .max(2000, 'Message must not exceed 2000 characters'),
  budget: z.string().max(100).optional(),
  timeline: z.string().max(100).optional(),
});

type ContactFormValues = z.infer<typeof contactFormSchema>;

interface ContactVendorModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  vendorId: string;
  vendorName: string;
}

const CONTACT_TYPES: { value: ContactType; label: string; description: string }[] = [
  {
    value: 'DEMO_REQUEST',
    label: 'Request Demo',
    description: 'Schedule a product demonstration',
  },
  {
    value: 'INFO_REQUEST',
    label: 'Request Information',
    description: 'Get more details about solutions',
  },
  {
    value: 'PRICING',
    label: 'Pricing Inquiry',
    description: 'Ask about pricing and packages',
  },
  {
    value: 'RFP',
    label: 'Submit RFP',
    description: 'Send a Request for Proposal',
  },
  {
    value: 'GENERAL',
    label: 'General Inquiry',
    description: 'Other questions or requests',
  },
];

const TIMELINE_OPTIONS = [
  '1-3 months',
  '3-6 months',
  '6-12 months',
  '12+ months',
  'Flexible',
];

const BUDGET_OPTIONS = [
  '$0 - $10K',
  '$10K - $50K',
  '$50K - $100K',
  '$100K - $250K',
  '$250K+',
  'Not specified',
];

export function ContactVendorModal({
  open,
  onOpenChange,
  vendorId,
  vendorName,
}: ContactVendorModalProps) {
  const { toast } = useToast();
  const contactVendorMutation = useContactVendor();

  const form = useForm<ContactFormValues>({
    resolver: zodResolver(contactFormSchema),
    defaultValues: {
      type: 'INFO_REQUEST',
      message: '',
      budget: '',
      timeline: '',
    },
  });

  const handleSubmit = async (values: ContactFormValues) => {
    try {
      await contactVendorMutation.mutateAsync({
        vendorId,
        ...values,
      });

      // Close modal and reset form on success
      onOpenChange(false);
      form.reset();
    } catch (error) {
      // Error handled by mutation's onError
      console.error('Contact vendor error:', error);
    }
  };

  const selectedType = form.watch('type');
  const selectedTypeInfo = CONTACT_TYPES.find((t) => t.value === selectedType);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Contact {vendorName}</DialogTitle>
          <DialogDescription>
            Send a message to this vendor. They will receive your contact information and respond
            via email.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
            {/* Contact Type */}
            <FormField
              control={form.control}
              name="type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Contact Type *</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select contact type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {CONTACT_TYPES.map((type) => (
                        <SelectItem key={type.value} value={type.value}>
                          <div className="flex flex-col">
                            <span className="font-medium">{type.label}</span>
                            <span className="text-xs text-gray-500">{type.description}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {selectedTypeInfo && (
                    <FormDescription>{selectedTypeInfo.description}</FormDescription>
                  )}
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Message */}
            <FormField
              control={form.control}
              name="message"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Message *</FormLabel>
                  <FormControl>
                    <Textarea
                      {...field}
                      placeholder="Describe your needs, questions, or requirements..."
                      rows={6}
                      className="resize-none"
                    />
                  </FormControl>
                  <FormDescription>
                    {field.value.length}/2000 characters
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Optional Fields */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Budget */}
              <FormField
                control={form.control}
                name="budget"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Budget (Optional)</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <DollarSign className="mr-2 h-4 w-4 text-gray-500" />
                          <SelectValue placeholder="Select budget range" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {BUDGET_OPTIONS.map((option) => (
                          <SelectItem key={option} value={option}>
                            {option}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Timeline */}
              <FormField
                control={form.control}
                name="timeline"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Timeline (Optional)</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <Calendar className="mr-2 h-4 w-4 text-gray-500" />
                          <SelectValue placeholder="Select timeline" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {TIMELINE_OPTIONS.map((option) => (
                          <SelectItem key={option} value={option}>
                            {option}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Info Box */}
            <div className="bg-blue-500/5 border border-blue-500/20 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <FileText className="h-5 w-5 text-blue-400 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-sm font-medium text-blue-100 mb-1">What happens next?</p>
                  <ul className="space-y-1 text-xs text-blue-300">
                    <li>• The vendor will receive your contact request via email</li>
                    <li>• They'll be able to see your message and contact details</li>
                    <li>• You'll receive their response directly to your email</li>
                    <li>• You can track this inquiry in the RFP Tracking dashboard</li>
                  </ul>
                </div>
              </div>
            </div>

            <DialogFooter className="flex gap-3 sm:gap-3">
              <Button
                type="button"
                onClick={() => {
                  onOpenChange(false);
                  form.reset();
                }}
                variant="outline"
                className="flex-1"
                disabled={contactVendorMutation.isPending}
              >
                <X className="mr-2 h-4 w-4" />
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={contactVendorMutation.isPending}
                className="flex-1"
              >
                {contactVendorMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Sending...
                  </>
                ) : (
                  <>
                    <Send className="mr-2 h-4 w-4" />
                    Send Message
                  </>
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
