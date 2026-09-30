'use client';

import React, { useState } from 'react';
import { Send, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useToast } from '@/components/ui/Toast';

export function ContactForm() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    subject: '',
    message: '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const { showToast } = useToast();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[name];
        return next;
      });
    }
  };

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.name.trim() || formData.name.trim().length < 2) {
      newErrors.name = 'Full name must be at least 2 characters';
    }
    if (!formData.email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email.trim())) {
      newErrors.email = 'Please provide a valid email address';
    }
    if (!formData.subject.trim() || formData.subject.trim().length < 2) {
      newErrors.subject = 'Subject is required';
    }
    if (!formData.message.trim() || formData.message.trim().length < 10) {
      newErrors.message = 'Message must be at least 10 characters long';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) {
      showToast('Please fix the errors in the form.', 'danger');
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to submit contact message');
      }

      setIsSuccess(true);
      showToast('Message sent! We will get back to you soon.', 'success');
      setFormData({
        name: '',
        email: '',
        phone: '',
        subject: '',
        message: '',
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to send message. Please try again.';
      showToast(msg, 'danger');
    } finally {
      setIsLoading(false);
    }
  };

  if (isSuccess) {
    return (
      <div className="border border-line bg-cream-soft p-8 text-center sm:p-12">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-ink text-cream">
          <CheckCircle2 className="h-7 w-7" />
        </div>
        <h3 className="heading-md text-ink">Inquiry Received</h3>
        <p className="mt-2 text-sm text-muted">
          Thank you for reaching out to Gents Hood. Our concierge team will review your inquiry and
          contact you shortly.
        </p>
        <Button variant="outline" size="md" className="mt-6" onClick={() => setIsSuccess(false)}>
          Send Another Message
        </Button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5 border border-line bg-cream-soft p-6 sm:p-8">
      <div className="space-y-1">
        <h2 className="heading-sm text-ink">Direct Atelier Inquiry</h2>
        <p className="text-xs text-muted">
          Leave your message below and our team will get in touch via email or phone.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Input
          label="Your Name *"
          name="name"
          placeholder="Enter your full name"
          value={formData.name}
          onChange={handleChange}
          error={errors.name}
          autoComplete="name"
        />
        <Input
          label="Email Address *"
          type="email"
          name="email"
          placeholder="Enter your email address"
          value={formData.email}
          onChange={handleChange}
          error={errors.email}
          autoComplete="email"
        />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Input
          label="Mobile Phone (Optional)"
          type="tel"
          name="phone"
          placeholder="01XXXXXXXXX"
          value={formData.phone}
          onChange={handleChange}
          helperText="For instant WhatsApp or phone follow-up"
          autoComplete="tel"
        />
        <Input
          label="Subject *"
          name="subject"
          placeholder="Inquiry subject (e.g. Sizing, Custom order)"
          value={formData.subject}
          onChange={handleChange}
          error={errors.subject}
        />
      </div>

      <div className="w-full">
        <label
          htmlFor="contact-message"
          className="mb-1.5 block text-[11px] font-medium uppercase tracking-looser text-ink"
        >
          Message *
        </label>
        <textarea
          id="contact-message"
          name="message"
          rows={5}
          placeholder="Describe how we can assist you..."
          value={formData.message}
          onChange={handleChange}
          className={`placeholder:text-muted/60 w-full rounded-[1px] border border-line bg-transparent px-4 py-3 text-sm text-ink transition-colors focus:border-ink focus:outline-none focus:ring-1 focus:ring-ink ${
            errors.message ? 'border-danger focus:border-danger focus:ring-danger' : ''
          }`}
        />
        {errors.message && <p className="mt-1 text-xs text-danger">{errors.message}</p>}
      </div>

      <Button
        type="submit"
        variant="primary"
        size="lg"
        isLoading={isLoading}
        className="w-full text-xs tracking-looser"
      >
        <Send className="mr-2 h-4 w-4" />
        Send Message
      </Button>
    </form>
  );
}
