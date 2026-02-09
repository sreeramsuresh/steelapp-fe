import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import MarketingLayout from "./MarketingLayout";

const Home = () => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isVisible, setIsVisible] = useState({});
  const [mounted, setMounted] = useState(false);

  const heroSlides = [
    {
      title: "Your Trusted",
      subtitle: "Partner in Steel Solutions",
      tagline: "IMPORTERS & STOCKIST OF STAINLESS STEEL PRODUCTS",
      image: "https://images.unsplash.com/photo-1581094288338-2314dddb7ece?w=1920&h=1080&fit=crop&q=80",
      overlay: "from-slate-900/70 via-gray-900/80 to-black/90",
    },
    {
      title: "Ultimate Steels",
      subtitle: "Powering Industries with Strength",
      tagline: "HIGH-QUALITY STEEL FOR MODERN CONSTRUCTION",
      image: "https://images.unsplash.com/photo-1504917595217-d4dc5ebe6122?w=1920&h=1080&fit=crop&q=80",
      overlay: "from-blue-900/70 via-slate-900/80 to-black/90",
    },
    {
      title: "Excellence in",
      subtitle: "Steel Solutions",
      tagline: "TRUSTED BY INDUSTRIES ACROSS THE UAE",
      image: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=1920&h=1080&fit=crop&q=80",
      overlay: "from-gray-900/70 via-slate-800/80 to-black/90",
    },
  ];

  const services = [
    {
      title: "Premium-Quality Steel Products",
      description: "High-grade steel materials meeting international standards for all industrial applications.",
      icon: "🏆",
      image: "https://images.unsplash.com/photo-1565814329452-e1efa11c5b89?w=500&h=400&fit=crop&q=80",
    },
    {
      title: "Customized Steel Fabrication",
      description: "Tailored fabrication solutions designed to meet your specific project requirements.",
      icon: "⚙️",
      image: "https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=500&h=400&fit=crop&q=80",
    },
    {
      title: "Reliable Supply & Distribution",
      description: "Efficient distribution network ensuring timely delivery across the UAE and GCC region.",
      icon: "🚛",
      image: "https://images.unsplash.com/photo-1599669237225-2a92d8aa5ec6?w=500&h=400&fit=crop&q=80",
    },
    {
      title: "Structural & Industrial Steel",
      description: "Comprehensive range of structural steel products for construction and industrial projects.",
      icon: "🏗️",
      image: "https://images.unsplash.com/photo-1590736969955-71cc94901144?w=500&h=400&fit=crop&q=80",
    },
  ];

  const industries = [
    {
      title: "Construction & Infrastructure",
      icon: "🏗️",
      image: "https://images.unsplash.com/photo-1541976590-713941681591?w=300&h=300&fit=crop&q=80",
      color: "from-blue-500 to-indigo-600",
    },
    {
      title: "Manufacturing & Engineering",
      icon: "⚙️",
      image: "https://images.unsplash.com/photo-1581094288338-2314dddb7ece?w=300&h=300&fit=crop&q=80",
      color: "from-green-500 to-emerald-600",
    },
    {
      title: "Marine & Shipbuilding",
      icon: "🚢",
      image: "https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=300&h=300&fit=crop&q=80",
      color: "from-cyan-500 to-blue-600",
    },
    {
      title: "Heavy Equipment",
      icon: "🏭",
      image: "https://images.unsplash.com/photo-1565814329452-e1efa11c5b89?w=300&h=300&fit=crop&q=80",
      color: "from-orange-500 to-red-600",
    },
    {
      title: "Oil and Gas",
      icon: "⚡",
      image: "https://images.unsplash.com/photo-1518709268805-4e9042af2176?w=300&h=300&fit=crop&q=80",
      color: "from-purple-500 to-pink-600",
    },
  ];

  // Auto-slide effect
  useEffect(() => {
    setMounted(true);
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % heroSlides.length);
    }, 6000);
    return () => clearInterval(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // heroSlides.length is stable (constant array) - uses functional setState to avoid dependency

  // Intersection Observer for scroll animations
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
      <div className="min-h-screen bg-white overflow-x-hidden">
        {/* Hero Carousel Section */}
        <section className="relative min-h-[120vh] lg:min-h-[100vh] overflow-hidden">
          <div className="absolute inset-0">
            {heroSlides.map((slide, index) => (
              <div
                key={slide.id || slide.name || `slide-${index}`}
                className={`absolute inset-0 transition-all duration-1000 ease-in-out ${
                  index === currentSlide ? "opacity-100 scale-100" : "opacity-0 scale-105"
                }`}
              >
                {/* Background Image */}
                <div
                  className="absolute inset-0 bg-cover bg-center transition-transform duration-[6000ms] ease-out"
                  style={{
                    backgroundImage: `url('${slide.image}')`,
                    transform: index === currentSlide ? "scale(1.1)" : "scale(1)",
                  }}
                />

                {/* Gradient Overlay */}
                <div className={`absolute inset-0 bg-gradient-to-r ${slide.overlay}`} />

                {/* Content */}
                <div className="relative h-full flex items-center mt-10 lg:mt-0">
                  <div className="max-w-7xl mx-auto px-6 text-white w-full">
                    <div className="max-w-5xl">
                      <div
                        className={`transform transition-all duration-1000 delay-300 ${
                          index === currentSlide ? "translate-y-0 opacity-100" : "translate-y-10 opacity-0"
                        }`}
                      >
                        <h1 className="text-7xl md:text-8xl font-bold mb-4 leading-tight">
                          <span className="block">{slide.title}</span>
                          <span className="block text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400">
                            {slide.subtitle}
                          </span>
                        </h1>

                        <div className="w-32 h-1 bg-gradient-to-r from-blue-500 to-purple-500 mb-8" />

                        <p className="text-xl md:text-2xl mb-12 text-gray-200 font-light tracking-wider">
                          {slide.tagline}
                        </p>

                        <div className="flex flex-col sm:flex-row gap-6">
                          <Link
                            to="/marketing/products"
                            className="group px-10 py-5 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl font-bold text-lg hover:from-blue-700 hover:to-indigo-700 transition-all duration-300 transform hover:scale-105 hover:shadow-2xl shadow-blue-500/25 text-white text-center"
                          >
                            <span className="flex items-center justify-center space-x-2">
                              <span>Explore Products</span>
                              <span className="transform group-hover:translate-x-1 transition-transform">→</span>
                            </span>
                          </Link>
                          <Link
                            to="/marketing/contact"
                            className="px-10 py-5 border-2 border-white/80 backdrop-blur-sm rounded-xl font-bold text-lg hover:bg-white hover:text-gray-900 transition-all duration-300 transform hover:scale-105 hover:shadow-2xl text-white text-center"
                          >
                            Contact Us Today
                          </Link>
                          <Link
                            to="/login"
                            className="px-10 py-5 rounded-xl font-bold text-lg transition-all duration-300 transform hover:scale-105 hover:shadow-2xl text-center marketing-login-btn"
                          >
                            Members Login
                          </Link>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Slide Navigation Dots */}
          <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 flex space-x-3 z-20">
            {heroSlides.map((_, index) => (
              <button
                type="button"
                key={_}
                className={`w-4 h-4 rounded-full transition-all duration-300 ${
                  index === currentSlide ? "bg-white scale-125 shadow-lg" : "bg-white/50 hover:bg-white/75"
                }`}
                onClick={() => setCurrentSlide(index)}
              />
            ))}
          </div>

          {/* Scroll Indicator */}
          <div className="absolute bottom-8 right-8 text-white animate-bounce">
            <div className="flex flex-col items-center space-y-2">
              <span className="text-sm font-light">Scroll Down</span>
              <div className="w-6 h-10 border-2 border-white/50 rounded-full flex justify-center">
                <div className="w-1 h-3 bg-white rounded-full mt-2 animate-pulse" />
              </div>
            </div>
          </div>
        </section>

        {/* Ultimate Steels Introduction */}
        <section
          id="section-intro"
          className={`py-24 transition-all duration-1000 ${
            isVisible["section-intro"] ? "opacity-100 translate-y-0" : "opacity-0 translate-y-20"
          }`}
        >
          <div className="max-w-7xl mx-auto px-6">
            <div className="grid lg:grid-cols-2 gap-16 items-center">
              {/* Image Side (move below heading on mobile) */}
              <div className="relative group">
                {/* Background decoration */}
                <div className="absolute -inset-4 bg-gradient-to-r from-blue-100 via-purple-50 to-pink-100 rounded-3xl transform rotate-2 group-hover:rotate-1 transition-transform duration-500" />
                <div className="absolute -inset-2 bg-gradient-to-r from-blue-200 via-purple-100 to-pink-200 rounded-3xl transform -rotate-1 group-hover:rotate-0 transition-transform duration-500" />

                {/* Main Image */}
                <div className="relative overflow-hidden rounded-2xl shadow-2xl">
                  <img
                    src="https://images.unsplash.com/photo-1504917595217-d4dc5ebe6122?w=800&h=600&fit=crop&q=80"
                    alt="Ultimate Steels Manufacturing"
                    className="w-full h-96 object-cover group-hover:scale-110 transition-transform duration-700"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
                </div>

                {/* Floating Stats Card */}
                <div className="absolute -bottom-8 -right-8 bg-gradient-to-r from-blue-600 to-indigo-600 text-white p-8 rounded-2xl shadow-2xl transform hover:scale-105 transition-transform duration-300">
                  <div className="text-4xl font-bold">15+</div>
                  <div className="text-sm opacity-90">Years of Excellence</div>
                  <div className="absolute -top-2 -left-2 w-6 h-6 bg-yellow-400 rounded-full animate-ping" />
                  <div className="absolute -top-2 -left-2 w-6 h-6 bg-yellow-500 rounded-full" />
                </div>
              </div>

              {/* Content Side (show first on mobile) */}
              <div className="space-y-8 order-1 lg:order-2">
                <div>
                  <h2 className="text-6xl font-bold text-gray-900 mb-6 leading-tight">Ultimate Steels</h2>
                  <div className="w-32 h-1 bg-gradient-to-r from-blue-600 to-purple-600 mb-8" />
                  <h3 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600 mb-8">
                    Powering Industries with Strength and Innovation
                  </h3>
                </div>

                <p className="text-xl text-gray-700 leading-relaxed">
                  At Ultimate Steels, we are committed to delivering high-quality steel products and solutions that
                  power industries, infrastructure, and innovation. With a strong foundation in expertise and
                  excellence, we cater to diverse sectors, including construction, manufacturing, oil & gas, and
                  industrial projects.
                </p>

                {/* Statistics moved to standalone section below */}
              </div>
            </div>
          </div>
        </section>

        {/* Key Stats */}
        <section id="section-stats" className="py-16 bg-white">
          <div className="max-w-7xl mx-auto px-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              {[
                {
                  number: "15+",
                  label: "Years Experience",
                  color: "from-blue-500 to-blue-600",
                  icon: "📅",
                },
                {
                  number: "500+",
                  label: "Projects Completed",
                  color: "from-green-500 to-green-600",
                  icon: "✅",
                },
                {
                  number: "50+",
                  label: "Happy Clients",
                  color: "from-purple-500 to-purple-600",
                  icon: "😊",
                },
                {
                  number: "99%",
                  label: "Success Rate",
                  color: "from-orange-500 to-orange-600",
                  icon: "🎯",
                },
              ].map((stat, index) => (
                <div
                  key={stat.id || stat.name || `stat-${index}`}
                  className="group bg-white p-6 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-2 border border-gray-100"
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className={`text-4xl font-bold bg-gradient-to-r ${stat.color} bg-clip-text text-transparent`}>
                      {stat.number}
                    </div>
                    <div className="text-2xl group-hover:scale-125 transition-transform duration-300">{stat.icon}</div>
                  </div>
                  <div className="text-sm text-gray-600 font-medium">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Our Metal Supplies */}
        <section
          id="section-services"
          className={`py-24 bg-gradient-to-br from-gray-50 via-slate-50 to-gray-100 transition-all duration-1000 ${
            isVisible["section-services"] ? "opacity-100 translate-y-0" : "opacity-0 translate-y-20"
          }`}
        >
          <div className="max-w-7xl mx-auto px-6">
            <div className="text-center mb-20">
              <h2 className="text-5xl font-bold text-gray-900 mb-6">Our Metal Supplies</h2>
              <div className="w-32 h-1 bg-gradient-to-r from-green-500 to-emerald-500 mx-auto mb-8" />
              <p className="text-xl text-gray-600 max-w-4xl mx-auto leading-relaxed">
                Comprehensive steel solutions engineered for excellence and designed to meet the evolving needs of
                modern industries across the UAE and beyond.
              </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
              {services.map((service, index) => (
                <div
                  key={service.id || service.name || `service-${index}`}
                  className="group bg-white rounded-3xl shadow-lg hover:shadow-2xl transition-all duration-500 hover:-translate-y-4 overflow-hidden border border-gray-100"
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  {/* Image with Icon Overlay */}
                  <div className="relative overflow-hidden">
                    <img
                      src={service.image}
                      alt={service.title}
                      className="w-full h-56 object-cover group-hover:scale-110 transition-transform duration-700"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />

                    {/* Floating Icon */}
                    <div className="absolute top-4 right-4 w-14 h-14 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center text-white text-2xl shadow-lg group-hover:scale-110 group-hover:rotate-12 transition-all duration-300">
                      {service.icon}
                    </div>

                    {/* Bottom Gradient */}
                    <div className="absolute bottom-0 left-0 right-0 h-20 bg-gradient-to-t from-white to-transparent" />
                  </div>

                  {/* Content */}
                  <div className="p-8 -mt-6 relative">
                    <h3 className="text-xl font-bold text-gray-900 mb-4 group-hover:text-blue-600 transition-colors duration-300">
                      {service.title}
                    </h3>
                    <p className="text-gray-600 leading-relaxed mb-6">{service.description}</p>

                    {/* Learn More Button */}
                    <button
                      type="button"
                      className="w-full py-3 bg-gradient-to-r from-gray-100 to-gray-200 text-gray-700 rounded-xl font-semibold group-hover:from-blue-500 group-hover:to-indigo-600 group-hover:text-white transition-all duration-300 transform group-hover:scale-105"
                    >
                      Learn More
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Serving UAE & Beyond */}
        <section
          id="section-coverage"
          className={`py-24 transition-all duration-1000 ${
            isVisible["section-coverage"] ? "opacity-100 translate-y-0" : "opacity-0 translate-y-20"
          }`}
        >
          <div className="max-w-7xl mx-auto px-6">
            <div className="grid lg:grid-cols-2 gap-16 items-center">
              {/* Content */}
              <div className="space-y-8">
                <div>
                  <h2 className="text-5xl font-bold text-gray-900 mb-6">Serving UAE & Beyond</h2>
                  <div className="w-32 h-1 bg-gradient-to-r from-emerald-500 to-teal-500 mb-8" />
                </div>

                <p className="text-xl text-gray-700 leading-relaxed">
                  While based in Ajman, Ultimate Steels proudly serves clients across the GCC, including Dubai, Abu
                  Dhabi, Sharjah, and other emirates. Our mission is to provide top-tier steel solutions that contribute
                  to the growth and success of construction and industrial projects throughout the region.
                </p>

                {/* Coverage Areas */}
                <div className="bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 p-8 rounded-3xl border border-blue-100">
                  <h3 className="text-2xl font-bold text-blue-900 mb-6 flex items-center space-x-3">
                    <span className="text-3xl">🌍</span>
                    <span>Our Service Coverage</span>
                  </h3>

                  <div className="grid grid-cols-2 gap-4">
                    {[
                      { name: "Ajman", status: "Headquarters", color: "blue" },
                      { name: "Dubai", status: "Full Service", color: "green" },
                      {
                        name: "Abu Dhabi",
                        status: "Full Service",
                        color: "purple",
                      },
                      {
                        name: "Sharjah",
                        status: "Full Service",
                        color: "orange",
                      },
                      {
                        name: "Other Emirates",
                        status: "Available",
                        color: "indigo",
                      },
                      {
                        name: "GCC Region",
                        status: "Expanding",
                        color: "pink",
                      },
                    ].map((area, index) => (
                      <div
                        key={area.id || area.name || `area-${index}`}
                        className="flex items-center space-x-3 p-3 bg-white/70 rounded-xl"
                      >
                        <span className={`w-4 h-4 rounded-full flex-shrink-0 ${
                          { blue: "bg-blue-500", green: "bg-green-500", purple: "bg-purple-500", orange: "bg-orange-500", indigo: "bg-indigo-500", pink: "bg-pink-500" }[area.color] || "bg-gray-500"
                        }`} />
                        <div>
                          <div className="font-semibold text-gray-900">{area.name}</div>
                          <div className="text-sm text-gray-600">{area.status}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Image */}
              <div className="relative">
                <div className="relative group overflow-hidden rounded-3xl shadow-2xl">
                  <img
                    src="https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&h=600&fit=crop&q=80"
                    alt="Steel Manufacturing Facility"
                    className="w-full h-[500px] object-cover group-hover:scale-105 transition-transform duration-700"
                  />

                  {/* Overlay Content */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
                  <div className="absolute bottom-8 left-8 text-white">
                    <h3 className="text-3xl font-bold mb-3">Modern Facilities</h3>
                    <p className="text-lg text-gray-200">State-of-the-art manufacturing and quality control</p>

                    {/* Floating Elements */}
                    <div className="flex space-x-4 mt-6">
                      <div className="flex items-center space-x-2 bg-white/20 backdrop-blur-sm px-4 py-2 rounded-xl">
                        <span>🏭</span>
                        <span className="text-sm">Advanced Equipment</span>
                      </div>
                      <div className="flex items-center space-x-2 bg-white/20 backdrop-blur-sm px-4 py-2 rounded-xl">
                        <span>✅</span>
                        <span className="text-sm">Quality Assured</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Industries We Serve */}
        <section
          id="section-industries"
          className={`py-24 bg-gradient-to-br from-slate-50 via-gray-50 to-slate-100 transition-all duration-1000 ${
            isVisible["section-industries"] ? "opacity-100 translate-y-0" : "opacity-0 translate-y-20"
          }`}
        >
          <div className="max-w-7xl mx-auto px-6">
            <div className="text-center mb-20">
              <h2 className="text-5xl font-bold text-gray-900 mb-6">Industries We Serve</h2>
              <div className="w-32 h-1 bg-gradient-to-r from-purple-500 to-pink-500 mx-auto mb-8" />
              <p className="text-xl text-gray-600 max-w-4xl mx-auto leading-relaxed">
                Trusted by diverse industries across the UAE and GCC region for premium steel solutions that drive
                innovation and excellence.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-8">
              {industries.map((industry, index) => (
                <div
                  key={industry.id || industry.name || `industry-${index}`}
                  className="group text-center"
                  style={{ animationDelay: `${index * 150}ms` }}
                >
                  {/* Main Image Container */}
                  <div className="relative mb-6 mx-auto">
                    <div className="w-40 h-40 mx-auto rounded-3xl overflow-hidden shadow-xl group-hover:shadow-2xl transition-all duration-500 group-hover:-translate-y-2">
                      <img
                        src={industry.image}
                        alt={industry.title}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
                    </div>

                    {/* Floating Icon */}
                    <div
                      className={`absolute -top-3 -right-3 w-16 h-16 bg-gradient-to-r ${industry.color} rounded-2xl flex items-center justify-center text-white text-2xl shadow-xl group-hover:scale-110 group-hover:rotate-12 transition-all duration-500`}
                    >
                      {industry.icon}
                    </div>

                    {/* Decorative Elements */}
                    <div className="absolute -bottom-2 -left-2 w-8 h-8 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-500 animate-pulse" />
                  </div>

                  {/* Title */}
                  <h3 className="text-lg font-bold text-gray-900 group-hover:text-blue-600 transition-colors duration-300 px-2">
                    {industry.title}
                  </h3>

                  {/* Hover Line */}
                  <div className="w-0 group-hover:w-16 h-1 bg-gradient-to-r from-blue-500 to-purple-500 mx-auto mt-3 transition-all duration-300" />
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Call to Action */}
        <section className="py-24 bg-gradient-to-r from-slate-900 via-gray-900 to-slate-800 text-white relative overflow-hidden">
          {/* Background Pattern */}
          <div className="absolute inset-0 opacity-10">
            <div
              className="absolute inset-0"
              style={{
                backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.1'%3E%3Ccircle cx='30' cy='30' r='2'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
              }}
            />
          </div>

          <div className="max-w-7xl mx-auto px-6 text-center relative z-10">
            <h2 className="text-6xl font-bold mb-6">Partner With Us For</h2>
            <div className="text-5xl font-bold mb-8">
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400">
                Excellence in Steel Solutions
              </span>
            </div>

            <p className="text-xl text-gray-300 max-w-4xl mx-auto mb-8 leading-relaxed">
              Explore our wide range of steel products and services. Whether you need bulk orders or custom fabrication,
              Ultimate Steels is your one-stop destination for premium steel solutions.
            </p>

            <div className="text-3xl font-bold mb-12 text-yellow-400">Building a Stronger Future Together!</div>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-6 justify-center mb-16">
              <button
                type="button"
                className="group px-12 py-5 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl font-bold text-xl hover:from-blue-700 hover:to-indigo-700 transition-all duration-300 transform hover:scale-105 shadow-xl hover:shadow-2xl"
              >
                <span className="flex items-center justify-center space-x-3">
                  <span>Get Quote</span>
                  <span className="transform group-hover:translate-x-1 transition-transform">💼</span>
                </span>
              </button>
              <button
                type="button"
                className="px-12 py-5 border-2 border-white/80 rounded-2xl font-bold text-xl hover:bg-white hover:text-gray-900 transition-all duration-300 transform hover:scale-105 shadow-xl"
              >
                View Products
              </button>
              <button
                type="button"
                className="group px-12 py-5 bg-gradient-to-r from-green-600 to-emerald-600 rounded-2xl font-bold text-xl hover:from-green-700 hover:to-emerald-700 transition-all duration-300 transform hover:scale-105 shadow-xl hover:shadow-2xl"
              >
                <span className="flex items-center justify-center space-x-3">
                  <span>Contact Us</span>
                  <span className="transform group-hover:rotate-12 transition-transform">📞</span>
                </span>
              </button>
            </div>

            {/* Additional Info */}
            <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
              <div className="text-center">
                <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center text-2xl mx-auto mb-4 shadow-lg">
                  🏆
                </div>
                <h3 className="text-xl font-bold mb-2">Premium Quality</h3>
                <p className="text-gray-400">International standards</p>
              </div>
              <div className="text-center">
                <div className="w-16 h-16 bg-gradient-to-r from-green-500 to-emerald-600 rounded-2xl flex items-center justify-center text-2xl mx-auto mb-4 shadow-lg">
                  ⚡
                </div>
                <h3 className="text-xl font-bold mb-2">Fast Delivery</h3>
                <p className="text-gray-400">Across UAE & GCC</p>
              </div>
              <div className="text-center">
                <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-pink-600 rounded-2xl flex items-center justify-center text-2xl mx-auto mb-4 shadow-lg">
                  👨‍🔧
                </div>
                <h3 className="text-xl font-bold mb-2">Expert Support</h3>
                <p className="text-gray-400">24/7 assistance</p>
              </div>
            </div>
          </div>
        </section>
      </div>
    </MarketingLayout>
  );
};

export default Home;
