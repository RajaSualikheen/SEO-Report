import Link from 'next/link'; 
import { Facebook, Twitter, Linkedin, Instagram, Mail, Globe, MapPin, Phone } from 'lucide-react'; // Added more icons for contact info

const Footer = () => {
    const currentYear: number = new Date().getFullYear(); // Explicitly type currentYear as number

    return (
        <footer className="bg-gray-900 dark:bg-gray-950 text-gray-300 py-16 px-4 sm:px-6 lg:px-8 transition-colors duration-500 shadow-inner">
            <div className="container mx-auto grid grid-cols-1 md:grid-cols-4 gap-12 border-b border-gray-700/50 dark:border-gray-800/70 pb-12 mb-12">
                {/* Brand Info */}
                <div className="col-span-1 md:col-span-1">
                    <h3 className="text-white text-3xl font-extrabold mb-5 leading-tight">CrestNova.Sol</h3>
                    <p className="text-gray-400 text-base leading-relaxed">
                        Your trusted partner in achieving unparalleled SEO excellence through cutting-edge AI insights.
                    </p>
                    <div className="flex space-x-6 mt-8">
                        <a href="https://facebook.com/crestnovasol" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-blue-500 transform hover:scale-125 transition-all duration-200">
                            <Facebook className="w-7 h-7" />
                        </a>
                        <a href="https://twitter.com/crestnovasol" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-blue-400 transform hover:scale-125 transition-all duration-200">
                            <Twitter className="w-7 h-7" />
                        </a>
                        <a href="https://linkedin.com/company/crestnovasol" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-blue-700 transform hover:scale-125 transition-all duration-200">
                            <Linkedin className="w-7 h-7" />
                        </a>
                        <a href="https://instagram.com/crestnovasol" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-pink-500 transform hover:scale-125 transition-all duration-200">
                            <Instagram className="w-7 h-7" />
                        </a>
                        <a href="mailto:info@crestnovasol.com" className="text-gray-400 hover:text-yellow-500 transform hover:scale-125 transition-all duration-200">
                            <Mail className="w-7 h-7" />
                        </a>
                    </div>
                </div>

                {/* Quick Links */}
                <div>
                    <h4 className="text-white text-xl font-semibold mb-5">Quick Links</h4>
                    <ul className="space-y-3 text-base">
                        <li><Link href="/features" className="text-gray-400 hover:text-white transition-colors duration-200">Features</Link></li>
                        <li><Link href="/pricing" className="text-gray-400 hover:text-white transition-colors duration-200">Pricing</Link></li>
                        <li><Link href="/how-it-works" className="text-gray-400 hover:text-white transition-colors duration-200">How It Works</Link></li>
                        <li><Link href="/testimonials" className="text-gray-400 hover:text-white transition-colors duration-200">Testimonials</Link></li>
                    </ul>
                </div>

                {/* Resources */}
                <div>
                    <h4 className="text-white text-xl font-semibold mb-5">Resources</h4>
                    <ul className="space-y-3 text-base">
                        <li><Link href="/blog" className="text-gray-400 hover:text-white transition-colors duration-200">Blog</Link></li>
                        <li><Link href="/support" className="text-gray-400 hover:text-white transition-colors duration-200">Support</Link></li>
                        <li><Link href="/faqs" className="text-gray-400 hover:text-white transition-colors duration-200">FAQs</Link></li>
                        <li><Link href="/api-docs" className="text-gray-400 hover:text-white transition-colors duration-200">API Docs</Link></li>
                    </ul>
                </div>

                {/* Contact Info */}
                <div>
                    <h4 className="text-white text-xl font-semibold mb-5">Get in Touch</h4>
                    <ul className="space-y-3 text-base">
                        <li className="flex items-center">
                            <MapPin className="w-5 h-5 text-blue-400 mr-3 flex-shrink-0" />
                            <address className="not-italic text-gray-400">123 SEO Boulevard, Digital City, 54000, PK</address>
                        </li>
                        <li className="flex items-center">
                            <Phone className="w-5 h-5 text-blue-400 mr-3 flex-shrink-0" />
                            <a href="tel:+1234567890" className="text-gray-400 hover:text-white transition-colors">(+92) 300 1234567</a>
                        </li>
                        <li className="flex items-center">
                            <Mail className="w-5 h-5 text-blue-400 mr-3 flex-shrink-0" />
                            <a href="mailto:support@crestnovasol.com" className="text-gray-400 hover:text-white transition-colors">support@crestnovasol.com</a>
                        </li>
                        <li className="flex items-center">
                            <Globe className="w-5 h-5 text-blue-400 mr-3 flex-shrink-0" />
                            {/* Link component for internal routes, a tag for external */}
                            <Link href="/" className="text-gray-400 hover:text-white transition-colors">www.crestnovasol.com</Link>
                        </li>
                    </ul>
                </div>
            </div>

            {/* Copyright */}
            <div className="text-center text-sm text-gray-500">
                &copy; {currentYear} CrestNova.Sol. All rights reserved.
                <p className="mt-2">Made with ❤️ for SEO Excellence.</p>
            </div>
        </footer>
    );
};

export default Footer;