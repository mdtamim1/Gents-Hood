import React from 'react';
import type { Metadata } from 'next';
import { Phone, Mail, MapPin, MessageSquare, Clock } from 'lucide-react';
import { getSiteSettings } from '@/lib/services/settings.service';
import { ContactForm } from './ContactForm';

export const metadata: Metadata = {
  title: 'Contact Us — GENTS HOOD Atelier',
  description:
    'Get in touch with the Gents Hood team. Direct WhatsApp concierge, showroom visits in Gulshan 2, Dhaka, and customer service inquiries.',
  openGraph: {
    title: 'Contact Us — GENTS HOOD Atelier',
    description:
      'Direct WhatsApp concierge, atelier showroom visits in Dhaka, and customer service inquiries.',
  },
};

export default async function ContactPage() {
  const settings = await getSiteSettings();

  const phone = settings.contactPhone || '+8801700000000';
  const email = settings.contactEmail || 'contact@gentshood.com';
  const whatsapp = settings.whatsapp || '+8801700000000';
  const address = settings.address || 'Gulshan 2, Dhaka, Bangladesh';
  const cleanWaNumber = whatsapp.replace(/[^\d]/g, '');

  return (
    <div className="bg-cream text-ink">
      {/* Top Banner / Heading */}
      <section className="border-b border-line bg-cream-soft py-12 sm:py-16">
        <div className="mx-auto max-w-[1440px] px-6 sm:px-10 lg:px-16">
          <span className="label-caps text-muted">Customer Service & Atelier</span>
          <h1 className="heading-xl mt-2 text-ink">Contact The Hood</h1>
          <p className="mt-3 max-w-2xl text-sm text-muted">
            Have a question regarding sizing, our fabrics, or your recent order? Our concierge team
            is ready to assist you through WhatsApp, phone, or direct inquiry.
          </p>
        </div>
      </section>

      {/* Main Content Grid */}
      <div className="mx-auto max-w-[1440px] px-6 py-12 sm:px-10 sm:py-16 lg:px-16">
        <div className="grid grid-cols-1 gap-12 lg:grid-cols-12">
          {/* Left: Contact Details & Info */}
          <div className="space-y-8 lg:col-span-5">
            <div>
              <h2 className="heading-md text-ink">Get in Touch</h2>
              <p className="mt-2 text-xs leading-relaxed text-muted">
                We take pride in our prompt communication. For immediate assistance during shopping
                hours, WhatsApp is the fastest channel.
              </p>
            </div>

            <div className="space-y-6">
              {/* WhatsApp Concierge */}
              <div className="flex items-start gap-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-ink text-cream">
                  <MessageSquare className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="label-caps text-ink">WhatsApp Concierge</h3>
                  <p className="mt-0.5 text-xs text-muted">Instant support & styling advice</p>
                  <a
                    href={`https://wa.me/${cleanWaNumber}?text=Hello%20Gents%20Hood%2C%20I%20have%20an%20inquiry`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-1 inline-block text-sm font-semibold text-ink underline underline-offset-4 transition-opacity hover:opacity-80"
                  >
                    Chat on WhatsApp ({whatsapp})
                  </a>
                </div>
              </div>

              {/* Direct Phone */}
              <div className="flex items-start gap-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-ink text-cream">
                  <Phone className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="label-caps text-ink">Call Center</h3>
                  <p className="mt-0.5 text-xs text-muted">Available Sat – Thu, 10 AM – 9 PM</p>
                  <a
                    href={`tel:${phone}`}
                    className="mt-1 inline-block text-sm font-semibold text-ink underline underline-offset-4 transition-opacity hover:opacity-80"
                  >
                    {phone}
                  </a>
                </div>
              </div>

              {/* Email */}
              <div className="flex items-start gap-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-ink text-cream">
                  <Mail className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="label-caps text-ink">Email Support</h3>
                  <p className="mt-0.5 text-xs text-muted">For business inquiries & support</p>
                  <a
                    href={`mailto:${email}`}
                    className="mt-1 inline-block text-sm font-semibold text-ink underline underline-offset-4 transition-opacity hover:opacity-80"
                  >
                    {email}
                  </a>
                </div>
              </div>

              {/* Atelier Address */}
              <div className="flex items-start gap-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-ink text-cream">
                  <MapPin className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="label-caps text-ink">Atelier & Studio</h3>
                  <p className="mt-0.5 text-sm font-medium text-ink">{address}</p>
                  <p className="mt-0.5 text-xs text-muted">By appointment & direct collection</p>
                </div>
              </div>

              {/* Hours */}
              <div className="flex items-start gap-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-ink text-cream">
                  <Clock className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="label-caps text-ink">Operating Hours</h3>
                  <p className="mt-0.5 text-xs text-muted">
                    Saturday – Thursday: 10:00 AM – 9:00 PM
                    <br />
                    Friday: 2:30 PM – 9:00 PM
                  </p>
                </div>
              </div>
            </div>

            {/* Map Embed */}
            <div className="overflow-hidden rounded-[1px] border border-line bg-cream-soft">
              <iframe
                title="Gents Hood Atelier Location"
                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d14602.700318625907!2d90.40733855!3d23.79458215!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3755c70c15ea1de1%3A0x97856381e3399a07!2sGulshan%2C%20Dhaka!5e0!3m2!1sen!2sbd!4v1700000000000!5m2!1sen!2sbd"
                width="100%"
                height="220"
                style={{ border: 0, filter: 'grayscale(0.6) contrast(1.1)' }}
                allowFullScreen={false}
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
              />
            </div>
          </div>

          {/* Right: Message Form */}
          <div className="lg:col-span-7">
            <ContactForm />
          </div>
        </div>
      </div>
    </div>
  );
}
