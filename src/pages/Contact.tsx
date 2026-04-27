import { Search, MapPin, Phone, Mail } from 'lucide-react';

export default function Contact() {
  return (
    <div className="max-w-3xl mx-auto py-12">
      <h1 className="text-4xl font-heading font-extrabold mb-6">Contact Us</h1>
      <div className="glass-card p-8 space-y-6">
        <div className="flex items-center gap-4">
          <Mail className="w-6 h-6 text-primary-500" />
          <span>contact@njac.com</span>
        </div>
        <div className="flex items-center gap-4">
          <Phone className="w-6 h-6 text-primary-500" />
          <span>+880 123456789</span>
        </div>
      </div>
    </div>
  );
}
