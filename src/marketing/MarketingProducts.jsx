import React from "react";
import { Link } from "react-router-dom";
import MarketingLayout from "./MarketingLayout";

const Products = () => {
  const metalSupplies = [
    {
      title: "Steel Coils",
      description:
        "High-quality coils for manufacturing and industrial applications.",
      image:
        "https://images.unsplash.com/photo-1504917595217-d4dc5ebe6122?w=400&h=400&fit=crop",
    },
    {
      title: "Steel Sheets",
      description:
        "Premium sheets for diverse construction and design purposes.",
      image:
        "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&h=400&fit=crop",
    },
    {
      title: "Stainless Steel Pipes",
      description:
        "Precision-made stainless steel pipes for superior durability.",
      image:
        "https://images.unsplash.com/photo-1621905252507-b35492cc74b4?w=400&h=400&fit=crop",
    },
    {
      title: "Steel Bars",
      description: "Durable and versatile for structural applications.",
      image:
        "https://images.unsplash.com/photo-1565814329452-e1efa11c5b89?w=400&h=400&fit=crop",
    },
    {
      title: "Steel Rods",
      description: "Strong and reliable for various industrial uses.",
      image:
        "https://images.unsplash.com/photo-1599669237225-2a92d8aa5ec6?w=400&h=400&fit=crop",
    },
    {
      title: "Steel Plates",
      description: "Robust and corrosion-resistant for multiple applications.",
      image:
        "https://images.unsplash.com/photo-1590736969955-71cc94901144?w=400&h=400&fit=crop",
    },
    {
      title: "Steel Angles",
      description:
        "Provides excellent support in framing and structural projects.",
      image:
        "https://images.unsplash.com/photo-1581094288338-2314dddb7ece?w=400&h=400&fit=crop",
    },
    {
      title: "Steel Channels",
      description: "Ideal for construction and fabrication needs.",
      image:
        "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&h=400&fit=crop",
    },
    {
      title: "Steel Beams",
      description: "Precision-engineered for strength and stability.",
      image:
        "https://images.unsplash.com/photo-1504917595217-d4dc5ebe6122?w=400&h=400&fit=crop",
    },
  ];

  const decorativeProducts = [
    {
      title: "Gold Finish PVD",
      image:
        "https://images.unsplash.com/photo-1582582621959-48d27397dc69?w=300&h=300&fit=crop",
    },
    {
      title: "Rose Gold PVD",
      image:
        "https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=300&h=300&fit=crop",
    },
    {
      title: "Black Chrome PVD",
      image:
        "https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=300&h=300&fit=crop",
    },
    {
      title: "Bronze PVD",
      image:
        "https://images.unsplash.com/photo-1598300042247-d088f8ab3a91?w=300&h=300&fit=crop",
    },
  ];

  const kitchenSolutions = [
    {
      image:
        "https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=300&h=300&fit=crop",
    },
    {
      image:
        "https://images.unsplash.com/photo-1582582621959-48d27397dc69?w=300&h=300&fit=crop",
    },
    {
      image:
        "https://images.unsplash.com/photo-1556909055-6f35a1b7e96c?w=300&h=300&fit=crop",
    },
    {
      image:
        "https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=300&h=300&fit=crop",
    },
  ];

  const elevationSolutions = [
    {
      image:
        "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=300&h=300&fit=crop",
    },
    {
      image:
        "https://images.unsplash.com/photo-1565814329452-e1efa11c5b89?w=300&h=300&fit=crop",
    },
    {
      image:
        "https://images.unsplash.com/photo-1504917595217-d4dc5ebe6122?w=300&h=300&fit=crop",
    },
    {
      image:
        "https://images.unsplash.com/photo-1590736969955-71cc94901144?w=300&h=300&fit=crop",
    },
  ];

  const industries = [
    {
      title: "Construction & Infrastructure",
      icon: "🏗️",
      image:
        "https://images.unsplash.com/photo-1541976590-713941681591?w=150&h=150&fit=crop",
    },
    {
      title: "Manufacturing & Engineering",
      icon: "⚙️",
      image:
        "https://images.unsplash.com/photo-1581094288338-2314dddb7ece?w=150&h=150&fit=crop",
    },
    {
      title: "Marine & Shipbuilding",
      icon: "🚢",
      image:
        "https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=150&h=150&fit=crop",
    },
    {
      title: "Heavy Equipment",
      icon: "🏭",
      image:
        "https://images.unsplash.com/photo-1565814329452-e1efa11c5b89?w=150&h=150&fit=crop",
    },
  ];

  return (
    <MarketingLayout>
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
        {/* Header */}
        <div className="bg-gradient-to-r from-slate-900 via-gray-900 to-slate-800 text-white">
          <div className="max-w-7xl mx-auto px-6 py-16">
            <h1 className="text-5xl font-bold mb-4">Products</h1>
            <p className="text-xl text-gray-300 max-w-2xl mb-6">
              Discover our comprehensive range of premium steel products
              engineered for excellence and built to last.
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
          {/* Metal Supplies Section */}
          <section className="mb-20">
            <div className="text-center mb-12">
              <h2 className="text-4xl font-bold text-gray-900 mb-4">
                Metal Supplies
              </h2>
              <div className="w-24 h-1 bg-gradient-to-r from-blue-600 to-indigo-600 mx-auto mb-6"></div>
              <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                Premium quality steel products for industrial, commercial and
                construction applications
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {metalSupplies.map((product, index) => (
                <div
                  key={index}
                  className="group bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 hover:-translate-y-2"
                >
                  <div className="relative overflow-hidden rounded-t-2xl">
                    <img
                      src={product.image}
                      alt={product.title}
                      className="w-full h-64 object-cover group-hover:scale-110 transition-transform duration-500"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  </div>
                  <div className="p-6">
                    <h3 className="text-xl font-bold text-gray-900 mb-3 group-hover:text-blue-600 transition-colors">
                      {product.title}
                    </h3>
                    <p className="text-gray-600 leading-relaxed">
                      {product.description}
                    </p>
                    <button className="mt-4 px-6 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg hover:from-blue-700 hover:to-indigo-700 transition-all duration-300 transform hover:scale-105">
                      Learn More
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Decorative PVD Sheets */}
          <section className="mb-20">
            <div className="text-center mb-12">
              <h2 className="text-4xl font-bold text-gray-900 mb-4">
                Decorative PVD Sheets
              </h2>
              <p className="text-2xl text-gradient bg-gradient-to-r from-amber-600 to-yellow-500 bg-clip-text text-transparent font-semibold">
                Metal Elegance
              </p>
              <div className="w-24 h-1 bg-gradient-to-r from-amber-500 to-yellow-500 mx-auto mt-4"></div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {decorativeProducts.map((product, index) => (
                <div
                  key={index}
                  className="group relative overflow-hidden rounded-xl shadow-lg hover:shadow-2xl transition-all duration-300"
                >
                  <img
                    src={product.image}
                    alt={product.title}
                    className="w-full h-64 object-cover group-hover:scale-110 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent">
                    <div className="absolute bottom-4 left-4 text-white">
                      <h3 className="text-lg font-bold">{product.title}</h3>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Kitchen Solutions */}
          <section className="mb-20">
            <div className="text-center mb-12">
              <h2 className="text-4xl font-bold text-gray-900 mb-4">
                Kitchen Solutions
              </h2>
              <div className="w-24 h-1 bg-gradient-to-r from-emerald-500 to-teal-500 mx-auto"></div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {kitchenSolutions.map((item, index) => (
                <div
                  key={index}
                  className="aspect-square rounded-xl overflow-hidden shadow-lg hover:shadow-xl transition-shadow duration-300"
                >
                  <img
                    src={item.image}
                    alt={`Kitchen solution ${index + 1}`}
                    className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                  />
                </div>
              ))}
            </div>
          </section>

          {/* Elevation Solutions */}
          <section className="mb-20">
            <div className="text-center mb-12">
              <h2 className="text-4xl font-bold text-gray-900 mb-4">
                Strength & Precision
              </h2>
              <p className="text-2xl text-gradient bg-gradient-to-r from-slate-600 to-gray-600 bg-clip-text text-transparent font-semibold">
                Elevation Solutions
              </p>
              <div className="w-24 h-1 bg-gradient-to-r from-slate-500 to-gray-500 mx-auto mt-4"></div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {elevationSolutions.map((item, index) => (
                <div
                  key={index}
                  className="aspect-square rounded-xl overflow-hidden shadow-lg hover:shadow-xl transition-shadow duration-300"
                >
                  <img
                    src={item.image}
                    alt={`Elevation solution ${index + 1}`}
                    className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                  />
                </div>
              ))}
            </div>
          </section>

          {/* Industries We Serve */}
          <section className="mb-20">
            <div className="text-center mb-12">
              <h2 className="text-4xl font-bold text-gray-900 mb-6">
                Industries We Serve
              </h2>
              <div className="w-24 h-1 bg-gradient-to-r from-purple-500 to-pink-500 mx-auto"></div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
              {industries.map((industry, index) => (
                <div key={index} className="text-center group">
                  <div className="relative mb-4">
                    <div className="w-32 h-32 mx-auto rounded-full overflow-hidden shadow-lg group-hover:shadow-xl transition-shadow duration-300">
                      <img
                        src={industry.image}
                        alt={industry.title}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                      />
                    </div>
                    <div className="absolute -top-2 -right-2 w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white text-2xl shadow-lg">
                      {industry.icon}
                    </div>
                  </div>
                  <h3 className="text-lg font-bold text-gray-900 group-hover:text-blue-600 transition-colors">
                    {industry.title}
                  </h3>
                </div>
              ))}
            </div>
          </section>

          {/* Call to Action */}
          <section className="bg-gradient-to-r from-slate-900 via-gray-900 to-slate-800 rounded-2xl p-12 text-center text-white">
            <h2 className="text-4xl font-bold mb-4">Partner With Us For</h2>
            <p className="text-3xl text-gradient bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent font-bold mb-6">
              Excellence in Steel Solutions
            </p>
            <p className="text-xl text-gray-300 max-w-3xl mx-auto mb-8">
              Explore our wide range of steel products and services. Whether you
              need bulk orders or custom fabrication, Ultimate Steels is your
              one-stop destination for premium steel solutions.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button className="px-8 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-lg font-semibold hover:from-blue-700 hover:to-indigo-700 transition-all duration-300 transform hover:scale-105 shadow-lg">
                Get Quote
              </button>
              <button className="px-8 py-4 border-2 border-white rounded-lg font-semibold hover:bg-white hover:text-gray-900 transition-all duration-300 transform hover:scale-105">
                Contact Us
              </button>
            </div>
          </section>
        </div>
      </div>
    </MarketingLayout>
  );
};

export default Products;
