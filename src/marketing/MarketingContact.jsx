import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import MarketingLayout from "./MarketingLayout";

const Contact = () => {
  const [isVisible, setIsVisible] = useState({});
  const [mounted] = useState(true);

  useEffect(() => {
    if (!mounted) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsVisible((prev) => ({ ...prev, [entry.target.id]: true }));
          }
        });
      },
      { threshold: 0.1, rootMargin: "50px" }
    );

    document.querySelectorAll('[id^="section-"]').forEach((el) => {
      observer.observe(el);
    });

    return () => observer.disconnect();
  }, [mounted]);

  if (!mounted) return null;

  return (
    <MarketingLayout>
      <div className="min-h-screen bg-white">
        {/* Hero Section */}
        <section className="relative bg-gradient-to-r from-slate-900 via-gray-900 to-slate-800 text-white py-20">
          <div className="absolute inset-0 bg-black opacity-20"></div>
          <div
            className="absolute inset-0 bg-cover bg-center opacity-30"
            style={{
              backgroundImage: `url('https://images.unsplash.com/photo-1581094288338-2314dddb7ece?w=1920&h=1080&fit=crop&q=80')`,
            }}
          ></div>

          <div className="relative max-w-7xl mx-auto px-6 text-center">
            <h1 className="text-5xl md:text-6xl font-bold mb-8">Contact us</h1>
            <Link
              to="/login"
              className="inline-block px-6 py-3 rounded-lg font-semibold transition-colors marketing-login-btn"
            >
              Members Login
            </Link>
          </div>
        </section>

        {/* Main Content */}
        <section
          id="section-main"
          className={`py-20 transition-all duration-1000 ${
            isVisible["section-main"] ? "opacity-100 translate-y-0" : "opacity-0 translate-y-20"
          }`}
        >
          <div className="max-w-7xl mx-auto px-6">
            {/* Let's Build Something Strong Together */}
            <div className="text-center mb-16">
              <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-8">
                Let&apos;s Build Something Strong Together!
              </h2>
              <p className="text-xl text-gray-700 max-w-5xl mx-auto leading-relaxed">
                At Ultimate Steels, we are more than just metal, we are the backbone of industries, the foundation of
                innovation, and your trusted partner in steel solutions. Whether you have a question, need a quote, or
                want to discuss a custom project, we&apos;re here to help
              </p>
            </div>

            {/* Contact Information */}
            <div className="grid lg:grid-cols-2 gap-16 items-start mb-20">
              {/* Contact Details */}
              <div className="space-y-8">
                <h3 className="text-3xl font-bold text-gray-900 mb-8">Get in Touch</h3>

                {/* Phone Numbers */}
                <div className="space-y-4">
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-emerald-600 rounded-full flex items-center justify-center">
                      <span className="text-white text-xl">📞</span>
                    </div>
                    <div>
                      <div className="text-xl font-semibold text-gray-900">+971 50 6061 680</div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-emerald-600 rounded-full flex items-center justify-center">
                      <span className="text-white text-xl">📞</span>
                    </div>
                    <div>
                      <div className="text-xl font-semibold text-gray-900">+971 50 6067 680</div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-emerald-600 rounded-full flex items-center justify-center">
                      <span className="text-white text-xl">📞</span>
                    </div>
                    <div>
                      <div className="text-xl font-semibold text-gray-900">+971 65 4456 80</div>
                    </div>
                  </div>
                </div>

                {/* Email */}
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full flex items-center justify-center">
                    <span className="text-white text-xl">✉️</span>
                  </div>
                  <div>
                    <div className="text-xl font-semibold text-gray-900">info@ultimatesteels.com</div>
                  </div>
                </div>

                {/* Address */}
                <div className="flex items-start space-x-4">
                  <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-pink-600 rounded-full flex items-center justify-center flex-shrink-0">
                    <span className="text-white text-xl">📍</span>
                  </div>
                  <div>
                    <div className="text-xl font-semibold text-gray-900">
                      Office - C1 - 1F - SF3857, Ajman Freezone, AJMAN - UAE
                    </div>
                  </div>
                </div>
              </div>

              {/* Contact Image */}
              <div className="relative">
                <div className="relative overflow-hidden rounded-2xl shadow-2xl">
                  <img
                    src="https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&h=600&fit=crop&q=80"
                    alt="Ultimate Steels Facility"
                    className="w-full h-96 object-cover hover:scale-105 transition-transform duration-700"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent"></div>
                </div>
              </div>
            </div>

            {/* Get in Touch Section */}
            <div className="text-center mb-16">
              <h3 className="text-3xl font-bold text-gray-900 mb-4">Get in Touch</h3>
              <div className="w-24 h-1 bg-gradient-to-r from-blue-600 to-indigo-600 mx-auto"></div>
            </div>
          </div>
        </section>

        {/* Serving Ajman & Beyond Section */}
        <section
          id="section-serving"
          className={`py-20 bg-gradient-to-br from-gray-50 to-slate-100 transition-all duration-1000 ${
            isVisible["section-serving"] ? "opacity-100 translate-y-0" : "opacity-0 translate-y-20"
          }`}
        >
          <div className="max-w-7xl mx-auto px-6">
            <div className="grid lg:grid-cols-2 gap-16 items-center">
              {/* Content */}
              <div className="space-y-6">
                <h2 className="text-4xl font-bold text-gray-900 mb-6">Serving Ajman & Beyond</h2>
                <div className="w-24 h-1 bg-gradient-to-r from-emerald-500 to-teal-500 mb-6"></div>

                <p className="text-xl text-gray-700 leading-relaxed">
                  While based in Ajman, Ultimate Steels proudly serves clients across the UAE, including Dubai, Abu
                  Dhabi, Sharjah, and other emirates. Our mission is to provide top-tier steel solutions that contribute
                  to the growth and success of construction and industrial projects throughout the region.
                </p>

                {/* Service Areas */}
                <div className="grid grid-cols-2 gap-4 mt-8">
                  {[
                    {
                      name: "Ajman",
                      status: "Headquarters",
                      color: "bg-blue-600",
                    },
                    {
                      name: "Dubai",
                      status: "Full Service",
                      color: "bg-green-600",
                    },
                    {
                      name: "Abu Dhabi",
                      status: "Full Service",
                      color: "bg-purple-600",
                    },
                    {
                      name: "Sharjah",
                      status: "Full Service",
                      color: "bg-orange-600",
                    },
                  ].map((area, index) => (
                    <div key={index} className="flex items-center space-x-3 p-4 bg-white rounded-xl shadow-lg">
                      <div className={`w-4 h-4 ${area.color} rounded-full`}></div>
                      <div>
                        <div className="font-semibold text-gray-900">{area.name}</div>
                        <div className="text-sm text-gray-600">{area.status}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Image */}
              <div className="relative">
                <img
                  src="https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&h=600&fit=crop&q=80"
                  alt="Steel Manufacturing"
                  className="w-full h-96 object-cover rounded-2xl shadow-2xl hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent rounded-2xl"></div>
              </div>
            </div>
          </div>
        </section>

        {/* Call to Action */}
        <section className="py-20 bg-gradient-to-r from-slate-900 via-gray-900 to-slate-800 text-white">
          <div className="max-w-7xl mx-auto px-6 text-center">
            <h2 className="text-4xl font-bold mb-6">Ready to Start Your Project?</h2>
            <p className="text-xl text-gray-300 max-w-3xl mx-auto mb-10 leading-relaxed">
              Contact Ultimate Steels today for premium steel solutions, competitive pricing, and exceptional service
              across the UAE.
            </p>

            <div className="flex flex-col sm:flex-row gap-6 justify-center">
              {/* eslint-disable-next-line local-rules/no-dead-button */}
              <button
                type="button"
                className="px-10 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold text-lg rounded-lg hover:from-blue-700 hover:to-indigo-700 transition-all duration-300 transform hover:scale-105 shadow-lg"
              >
                Request Quote
              </button>
              {/* eslint-disable-next-line local-rules/no-dead-button */}
              <button
                type="button"
                className="px-10 py-4 border-2 border-white text-white font-bold text-lg rounded-lg hover:bg-white hover:text-gray-900 transition-all duration-300 transform hover:scale-105"
              >
                Schedule Visit
              </button>
              {/* eslint-disable-next-line local-rules/no-dead-button */}
              <button
                type="button"
                className="px-10 py-4 bg-gradient-to-r from-green-600 to-emerald-600 text-white font-bold text-lg rounded-lg hover:from-green-700 hover:to-emerald-700 transition-all duration-300 transform hover:scale-105 shadow-lg"
              >
                Call Now
              </button>
            </div>
          </div>
        </section>
      </div>
    </MarketingLayout>
  );
};

export default Contact;
