import { Link } from "react-router-dom";
import MarketingLayout from "./MarketingLayout";

const About = () => {
  const products = [
    "Structural Steel (Beams, Channels, Angles)",
    "Steel Pipes & Tubes",
    "Roofing & Cladding Sheets",
    "Steel Plates & Coils",
    "Reinforcement Bars (Rebars)",
    "Customized Fabrication Solutions",
  ];

  const whyChooseUs = [
    {
      title: "Premium Quality",
      description: "We source and supply only the best steel materials, adhering to international standards.",
      icon: "⭐",
      color: "from-amber-500 to-yellow-500",
    },
    {
      title: "Competitive Pricing",
      description: "We provide cost-effective solutions without compromising on quality.",
      icon: "💰",
      color: "from-green-500 to-emerald-500",
    },
    {
      title: "Timely Delivery",
      description: "With a strong distribution network across the UAE, we ensure prompt delivery.",
      icon: "🚛",
      color: "from-blue-500 to-indigo-500",
    },
    {
      title: "Expert Support",
      description:
        "Our team of professionals is always ready to assist with technical guidance and customized solutions.",
      icon: "👨‍🔧",
      color: "from-purple-500 to-pink-500",
    },
    {
      title: "Customer Satisfaction",
      description: "Your success is our priority, and we strive to exceed expectations with every order.",
      icon: "❤️",
      color: "from-red-500 to-rose-500",
    },
  ];

  const galleryImages = [
    {
      src: "https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=800&h=600&fit=crop",
      alt: "Arc welding steel construction site",
      title: "Precision Welding",
    },
    {
      src: "https://images.unsplash.com/photo-1565814329452-e1efa11c5b89?w=800&h=600&fit=crop",
      alt: "Factory worker in warehouse",
      title: "Industrial Operations",
    },
    {
      src: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&h=600&fit=crop",
      alt: "Worker in metalworking plant",
      title: "Expert Craftsmanship",
    },
    {
      src: "https://images.unsplash.com/photo-1581094288338-2314dddb7ece?w=800&h=600&fit=crop",
      alt: "Factory production hall",
      title: "Modern Facilities",
    },
    {
      src: "https://images.unsplash.com/photo-1504917595217-d4dc5ebe6122?w=800&h=600&fit=crop",
      alt: "Steel manufacturing",
      title: "Quality Manufacturing",
    },
    {
      src: "https://images.unsplash.com/photo-1590736969955-71cc94901144?w=800&h=600&fit=crop",
      alt: "Steel plates",
      title: "Premium Materials",
    },
  ];

  const emirates = [
    { name: "Ajman", status: "headquarters", color: "bg-blue-600" },
    { name: "Dubai", status: "serving", color: "bg-emerald-600" },
    { name: "Abu Dhabi", status: "serving", color: "bg-purple-600" },
    { name: "Sharjah", status: "serving", color: "bg-orange-600" },
    { name: "Other Emirates", status: "serving", color: "bg-indigo-600" },
  ];

  return (
    <MarketingLayout>
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
        {/* Hero Section */}
        <div className="relative bg-gradient-to-r from-slate-900 via-gray-900 to-slate-800 text-white overflow-hidden">
          <div className="absolute inset-0 bg-black opacity-50"></div>
          <div
            className="absolute inset-0 bg-cover bg-center"
            style={{
              backgroundImage: `url('https://images.unsplash.com/photo-1581094288338-2314dddb7ece?w=1920&h=1080&fit=crop')`,
            }}
          ></div>
          <div className="relative max-w-7xl mx-auto px-6 py-24">
            <h1 className="text-6xl font-bold mb-6 animate-fade-in">About Us</h1>
            <div className="w-32 h-1 bg-gradient-to-r from-blue-500 to-purple-500 mb-8"></div>
            <p className="text-2xl text-gray-200 max-w-3xl leading-relaxed mb-6">
              Your premier supplier of high-quality steel building materials in Ajman and across the UAE
            </p>
            <Link
              to="/login"
              className="inline-block px-6 py-3 rounded-lg font-semibold transition-colors marketing-login-btn"
            >
              Members Login
            </Link>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-6 py-16">
          {/* Who We Are Section */}
          <section className="mb-20">
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              <div className="space-y-6">
                <h2 className="text-4xl font-bold text-gray-900 mb-6">Who We Are</h2>
                <div className="w-24 h-1 bg-gradient-to-r from-blue-600 to-indigo-600 mb-8"></div>

                <p className="text-lg text-gray-700 leading-relaxed">
                  Welcome to <span className="font-bold text-blue-600">Ultimate Steels</span>, your premier supplier of
                  high-quality steel building materials in Ajman and across the UAE. With years of expertise in the
                  industry, we have built a reputation for delivering durable, reliable, and cost-effective steel
                  solutions tailored to meet the needs of construction, infrastructure, and industrial projects.
                </p>

                <p className="text-lg text-gray-700 leading-relaxed">
                  At Ultimate Steels, we take pride in being a trusted name in the steel supply sector. We specialize in
                  providing top-grade steel products, ensuring strength, flexibility, and longevity for projects of all
                  sizes. Whether you are working on commercial, residential, or industrial developments, our
                  comprehensive range of steel materials is designed to meet international standards and
                  project-specific requirements.
                </p>

                <div className="flex space-x-4 pt-6">
                  <div className="text-center">
                    <div className="text-3xl font-bold text-blue-600">15+</div>
                    <div className="text-sm text-gray-600">Years Experience</div>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl font-bold text-green-600">500+</div>
                    <div className="text-sm text-gray-600">Projects Completed</div>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl font-bold text-purple-600">99%</div>
                    <div className="text-sm text-gray-600">Client Satisfaction</div>
                  </div>
                </div>
              </div>

              <div className="relative">
                <div className="relative rounded-2xl overflow-hidden shadow-2xl transform hover:scale-105 transition-transform duration-500">
                  <img
                    src="https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=800&h=600&fit=crop"
                    alt="Steel construction"
                    className="w-full h-96 object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent"></div>
                </div>
                <div className="absolute -bottom-6 -right-6 w-24 h-24 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full flex items-center justify-center text-white text-3xl shadow-xl">
                  🏗️
                </div>
              </div>
            </div>
          </section>

          {/* Products & Services Section */}
          <section className="mb-20">
            <div className="text-center mb-12">
              <h2 className="text-4xl font-bold text-gray-900 mb-4">Our Products & Services</h2>
              <div className="w-24 h-1 bg-gradient-to-r from-green-600 to-teal-600 mx-auto mb-6"></div>
              <p className="text-lg text-gray-600 max-w-3xl mx-auto">
                We offer a wide range of steel building materials, ensuring strength, flexibility, and longevity for
                projects of all sizes.
              </p>
            </div>

            <div className="bg-white rounded-2xl shadow-xl p-8">
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {products.map((product, index) => (
                  <div
                    key={product}
                    className="group flex items-center space-x-4 p-4 rounded-xl hover:bg-gradient-to-r hover:from-blue-50 hover:to-indigo-50 transition-all duration-300 cursor-pointer border border-transparent hover:border-blue-200"
                  >
                    <div className="w-12 h-12 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-full flex items-center justify-center text-white font-bold text-lg group-hover:scale-110 transition-transform duration-300">
                      {index + 1}
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">
                        {product}
                      </h3>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-8 p-6 bg-gradient-to-r from-slate-50 to-gray-50 rounded-xl">
                <p className="text-gray-700 text-center">
                  <span className="font-bold">Expert Team:</span> Our team of experts ensures that every product is
                  sourced and manufactured with the highest level of precision, meeting the demands of modern
                  construction and engineering projects.
                </p>
              </div>
            </div>
          </section>

          {/* Why Choose Us Section */}
          <section className="mb-20">
            <div className="text-center mb-12">
              <h2 className="text-4xl font-bold text-gray-900 mb-4">Why Choose Us?</h2>
              <div className="w-24 h-1 bg-gradient-to-r from-purple-600 to-pink-600 mx-auto mb-6"></div>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {whyChooseUs.map((item, index) => (
                <div
                  key={item.id || item.name || `item-${index}`}
                  className="group bg-white rounded-2xl p-8 shadow-lg hover:shadow-2xl transition-all duration-300 hover:-translate-y-2"
                >
                  <div
                    className={`w-16 h-16 bg-gradient-to-r ${item.color} rounded-2xl flex items-center justify-center text-2xl text-white mb-6 group-hover:scale-110 transition-transform duration-300`}
                  >
                    {item.icon}
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-4 group-hover:text-blue-600 transition-colors">
                    {item.title}
                  </h3>
                  <p className="text-gray-600 leading-relaxed">{item.description}</p>
                </div>
              ))}
            </div>
          </section>

          {/* Gallery Section */}
          <section className="mb-20">
            <div className="text-center mb-12">
              <h2 className="text-4xl font-bold text-gray-900 mb-4">Our Facilities & Work</h2>
              <div className="w-24 h-1 bg-gradient-to-r from-orange-500 to-red-500 mx-auto mb-6"></div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {galleryImages.map((image, index) => (
                <div
                  key={image.id || image.name || `image-${index}`}
                  className="group relative overflow-hidden rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300"
                >
                  <img
                    src={image.src}
                    alt={image.alt}
                    className="w-full h-64 object-cover group-hover:scale-110 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <div className="absolute bottom-4 left-4 text-white">
                      <h3 className="text-lg font-bold">{image.title}</h3>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Serving UAE Section */}
          <section className="mb-20">
            <div className="bg-gradient-to-r from-slate-900 via-gray-900 to-slate-800 rounded-2xl p-12 text-white">
              <div className="text-center mb-12">
                <h2 className="text-4xl font-bold mb-4">Serving UAE & Beyond</h2>
                <div className="w-24 h-1 bg-gradient-to-r from-emerald-500 to-teal-500 mx-auto mb-6"></div>
                <p className="text-xl text-gray-300 max-w-4xl mx-auto leading-relaxed">
                  While based in Ajman, Ultimate Steels proudly serves clients across the UAE, including Dubai, Abu
                  Dhabi, Sharjah, and other emirates. Our mission is to provide top-tier steel solutions that contribute
                  to the growth and success of construction and industrial projects throughout the region.
                </p>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6">
                {emirates.map((emirate, index) => (
                  <div key={emirate.id || emirate.name || `emirate-${index}`} className="text-center group">
                    <div
                      className={`w-20 h-20 ${emirate.color} rounded-full mx-auto mb-4 flex items-center justify-center group-hover:scale-110 transition-transform duration-300 shadow-lg`}
                    >
                      <span className="text-2xl text-white font-bold">{emirate.name.charAt(0)}</span>
                    </div>
                    <h3 className="font-bold text-white mb-1">{emirate.name}</h3>
                    <span
                      className={`text-sm px-3 py-1 rounded-full ${
                        emirate.status === "headquarters"
                          ? "bg-yellow-500/20 text-yellow-300 border border-yellow-500/30"
                          : "bg-green-500/20 text-green-300 border border-green-500/30"
                      }`}
                    >
                      {emirate.status === "headquarters" ? "HQ" : "Serving"}
                    </span>
                  </div>
                ))}
              </div>

              <div className="mt-12 text-center">
                <button
                  type="button"
                  onClick={() => {
                    window.location.href = "/marketing/contact";
                  }}
                  className="px-8 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-lg font-semibold hover:from-blue-700 hover:to-indigo-700 transition-all duration-300 transform hover:scale-105 shadow-lg mr-4"
                >
                  Get a Quote
                </button>
                <button
                  type="button"
                  onClick={() => {
                    window.location.href = "/marketing/contact";
                  }}
                  className="px-8 py-4 border-2 border-white rounded-lg font-semibold hover:bg-white hover:text-gray-900 transition-all duration-300 transform hover:scale-105"
                >
                  Contact Us Today
                </button>
              </div>
            </div>
          </section>
        </div>
      </div>
    </MarketingLayout>
  );
};

export default About;
