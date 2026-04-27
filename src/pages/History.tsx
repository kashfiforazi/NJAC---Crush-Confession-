import React from 'react';
import { BookOpen, GraduationCap, MapPin, Building, UserCheck } from 'lucide-react';
import { useSettings } from '../contexts/SettingsContext';

export default function History() {
  const { founderImage, principalImage } = useSettings();

  return (
    <div className="max-w-5xl mx-auto py-12 px-4 space-y-16">
      {/* Hero Section */}
      <div className="relative overflow-hidden rounded-2xl glass-card border border-slate-200 dark:border-slate-700 shadow-lg">
        <div className="absolute inset-0 z-0">
          <img 
            src="https://images.unsplash.com/photo-1541339907198-e08756dedf3f?ixlib=rb-4.0.3&auto=format&fit=crop&w=1400&q=80" 
            alt="Nimsar College Campus" 
            className="w-full h-full object-cover opacity-30 dark:opacity-40 mix-blend-overlay"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-900/90 to-slate-900/40"></div>
        </div>
        <div className="relative z-10 p-12 md:p-20 text-center text-white">
          <GraduationCap className="w-16 h-16 mx-auto mb-6 text-primary-400 drop-shadow-md" />
          <h1 className="text-4xl md:text-6xl font-heading font-extrabold mb-4 drop-shadow-lg text-white">Nimsar Junab Ali College</h1>
          <p className="text-xl md:text-2xl text-slate-100 font-medium max-w-2xl mx-auto drop-shadow-md">A legacy of education, excellence, and community-building in Cumilla.</p>
        </div>
      </div>

      {/* Founder Section */}
      <div className="grid md:grid-cols-2 gap-12 items-center">
        <div className="order-2 md:order-1 space-y-6">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 text-sm font-extrabold uppercase tracking-wider shadow-sm">
            <BookOpen className="w-4 h-4" />
            <span>প্রতিষ্ঠাতা</span>
          </div>
          <h2 className="text-3xl md:text-4xl font-heading font-extrabold text-slate-900 dark:text-white">
            মরহুম জুনাব আলী সাহেব
          </h2>
          <div className="prose prose-slate dark:prose-invert max-w-none text-slate-800 dark:text-slate-200 font-medium leading-relaxed">
            <p>
              নিমসারের শিক্ষা প্রসারে মরহুম জুনাব আলী সাহেবের অবদান অনস্বীকার্য। অত্র অঞ্চলের মানুষের মাঝে শিক্ষার আলো ছড়িয়ে দেওয়ার মহান ব্রত নিয়ে তিনি নিমসারে এই কলেজটি প্রতিষ্ঠা করেন। 
            </p>
            <p>
              তৎকালীন সময়ে শিক্ষার প্রসার খুবই সীমিত ছিল। জনাব জুনাব আলী সাহেব নিজের ব্যক্তিগত সম্পদ ও ঐকান্তিক প্রচেষ্টায় এই বিদ্যাপীঠ গড়ে তোলেন, যা আজ বৃহত্তর কুমিল্লার অন্যতম শ্রেষ্ঠ শিক্ষা প্রতিষ্ঠান হিসেবে মাথা উঁচু করে দাঁড়িয়ে আছে। তাঁর নিরলস শ্রম ও ত্যাগের ফলেই আজ হাজারো শিক্ষার্থী উচ্চশিক্ষার সুযোগ পাচ্ছে।
            </p>
            <ul className="space-y-3 mt-6 font-bold text-slate-800 dark:text-slate-200">
              <li className="flex items-center space-x-3"><div className="w-2 h-2 rounded-full bg-primary-500 shadow-sm shadow-primary-500"></div><span>দানবীর এবং শিক্ষানুরাগী</span></li>
              <li className="flex items-center space-x-3"><div className="w-2 h-2 rounded-full bg-primary-500 shadow-sm shadow-primary-500"></div><span>সমাজ সংস্কারক</span></li>
              <li className="flex items-center space-x-3"><div className="w-2 h-2 rounded-full bg-primary-500 shadow-sm shadow-primary-500"></div><span>স্থানীয় মানুষের আপনজন</span></li>
            </ul>
          </div>
        </div>
        <div className="order-1 md:order-2">
          <div className="relative max-w-sm mx-auto">
            <div className="aspect-[3/4] rounded-2xl overflow-hidden glass-card p-2 transform rotate-2 hover:rotate-0 transition-transform duration-500 border-2 border-slate-200 dark:border-slate-700 shadow-xl">
              <img 
                src={founderImage || "https://images.unsplash.com/photo-1544717297-fa95b6ee9643?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80"} 
                alt="Founder Junab Ali" 
                className="w-full h-full object-cover rounded-xl filter sepia-[.2]"
              />
              <div className="absolute bottom-4 left-4 right-4 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md pb-2 pt-3 px-4 rounded-xl text-center shadow-lg border border-slate-100 dark:border-slate-800">
                <span className="block font-heading font-extrabold text-lg text-slate-900 dark:text-white">জুনাব আলী</span>
                <span className="text-sm font-bold text-primary-600 dark:text-primary-400">প্রতিষ্ঠাতা</span>
              </div>
            </div>
            <div className="absolute -z-10 -inset-6 bg-primary-500/20 blur-3xl rounded-full"></div>
          </div>
        </div>
      </div>

      {/* Principal Section */}
      <div className="grid md:grid-cols-2 gap-12 items-center pt-8 border-t border-slate-200 dark:border-slate-800">
        <div className="order-1">
          <div className="relative max-w-sm mx-auto">
            <div className="aspect-[3/4] rounded-2xl overflow-hidden glass-card p-2 transform -rotate-2 hover:rotate-0 transition-transform duration-500 border-2 border-slate-200 dark:border-slate-700 shadow-xl">
              <img 
                src={principalImage || "https://images.unsplash.com/photo-1556157382-97eda2d62296?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80"} 
                alt="Principal" 
                className="w-full h-full object-cover rounded-xl"
              />
              <div className="absolute bottom-4 left-4 right-4 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md pb-2 pt-3 px-4 rounded-xl text-center shadow-lg border border-slate-100 dark:border-slate-800">
                <span className="block font-heading font-extrabold text-lg text-slate-900 dark:text-white">অধ্যক্ষ</span>
                <span className="text-sm font-bold text-primary-600 dark:text-primary-400">বর্তমান অধ্যক্ষ</span>
              </div>
            </div>
            <div className="absolute -z-10 -inset-6 bg-blue-500/15 blur-3xl rounded-full"></div>
          </div>
        </div>
        <div className="order-2 space-y-6">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 text-sm font-extrabold uppercase tracking-wider shadow-sm">
            <UserCheck className="w-4 h-4" />
            <span>অধ্যক্ষের বাণী</span>
          </div>
          <h2 className="text-3xl md:text-4xl font-heading font-extrabold text-slate-900 dark:text-white">
            বর্তমান অধ্যক্ষের কথা
          </h2>
          <div className="prose prose-slate dark:prose-invert max-w-none text-slate-800 dark:text-slate-200 font-medium leading-relaxed">
            <p>
              নিমসারের এই স্বনামধন্য প্রতিষ্ঠানে শিক্ষার্থীদের যুগোপযোগী শিক্ষায় শিক্ষিত করার লক্ষ্যে আমরা নিরলস কাজ করে যাচ্ছি। আমাদের লক্ষ্য শুধুমাত্র পুঁথিগত বিদ্যা নয়, বরং শিক্ষার্থীদের মানবিক মূল্যবোধ, নৈতিকতা ও আধুনিক সময়ের চ্যালেঞ্জ মোকাবিলার জন্য প্রস্তুত করা।
            </p>
            <p>
              শিক্ষক, শিক্ষার্থী ও অভিভাবকদের সম্মিলিত প্রচেষ্টায় আমরা এই কলেজকে একটি আদর্শ শিক্ষাঙ্গন হিসেবে গড়ে তুলতে বদ্ধপরিকর।
            </p>
          </div>
        </div>
      </div>

      {/* College History */}
      <div className="glass-card p-8 md:p-12 relative overflow-hidden border border-slate-200 dark:border-slate-700 shadow-xl rounded-2xl">
        <Building className="absolute -top-10 -right-10 w-48 h-48 text-primary-500/10 dark:text-primary-500/20 rotate-12 pointer-events-none" />
        
        <div className="max-w-3xl space-y-6 relative z-10">
          <h2 className="text-3xl font-heading font-extrabold mb-8 text-slate-900 dark:text-white">Nimsar Junab Ali College History</h2>
          
          <div className="space-y-8">
             <div className="flex gap-4">
                <div className="mt-1 bg-primary-100 dark:bg-primary-900/40 p-2 rounded-xl text-primary-600 shadow-sm shrink-0 h-12 w-12 flex items-center justify-center">
                  <MapPin className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-xl font-extrabold mb-2 text-slate-900 dark:text-white">Location & Establishment</h3>
                  <p className="text-slate-800 dark:text-slate-200 font-medium leading-relaxed">
                    Nimsar Junab Ali College is situated in a vibrant and accessible location in Nimsar, Burichang upazila of Cumilla district. It was established with the vision of eradicating illiteracy and empowering the youth with modern education. Over the decades, it has grown its infrastructure and academic offerings substantially.
                  </p>
                </div>
             </div>

             <div className="flex gap-4">
                <div className="mt-1 bg-primary-100 dark:bg-primary-900/40 p-2 rounded-xl text-primary-600 shadow-sm shrink-0 h-12 w-12 flex items-center justify-center">
                  <BookOpen className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-xl font-extrabold mb-2 text-slate-900 dark:text-white">Academic Journey</h3>
                  <p className="text-slate-800 dark:text-slate-200 font-medium leading-relaxed">
                    Starting with a few core subjects, the college now offers a wide array of disciplines across Humanities, Science, and Business Studies. It is affiliated with the Comilla Education Board and National University, allowing students to pursue both Higher Secondary Certificates (HSC) and degree-level higher education. 
                  </p>
                </div>
             </div>

             <div className="flex gap-4">
                <div className="mt-1 bg-primary-100 dark:bg-primary-900/40 p-2 rounded-xl text-primary-600 shadow-sm shrink-0 h-12 w-12 flex items-center justify-center">
                  <GraduationCap className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-xl font-extrabold mb-2 text-slate-900 dark:text-white">Achievements & Extracurriculars</h3>
                  <p className="text-slate-800 dark:text-slate-200 font-medium leading-relaxed">
                    Beyond academics, Nimsar Junab Ali College has a rich tradition in sports, cultural events, and social service programs like BNCC and Rover Scout. The vibrant campus life helps shape students into well-rounded, responsible citizens of tomorrow.
                  </p>
                </div>
             </div>
          </div>
        </div>
      </div>
      
    </div>
  );
}
