import { Link } from "react-router-dom";

const MarketingFooter = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-gray-50 border-t border-gray-200">
      <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Company Info */}
          <div className="space-y-4">
            <div className="flex items-center">
              <span className="text-xl font-bold text-primary-500 font-montserrat">ULTIMATE STEELS</span>
            </div>
            <p className="text-gray-600 text-sm leading-relaxed">
              Importers & Stockist of Stainless Steel Products. Powering Industries with Strength and Innovation across
              UAE & GCC countries.
            </p>
          </div>

          {/* Quick Links */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wider">Quick Links</h3>
            <ul className="space-y-2">
              <li>
                <Link
                  to="/marketing"
                  className="text-gray-600 hover:text-primary-600 text-sm transition-colors duration-200"
                >
                  Home
                </Link>
              </li>
              <li>
                <Link
                  to="/marketing/about"
                  className="text-gray-600 hover:text-primary-600 text-sm transition-colors duration-200"
                >
                  About Us
                </Link>
              </li>
              <li>
                <Link
                  to="/marketing/products"
                  className="text-gray-600 hover:text-primary-600 text-sm transition-colors duration-200"
                >
                  Products
                </Link>
              </li>
              <li>
                <Link
                  to="/marketing/contact"
                  className="text-gray-600 hover:text-primary-600 text-sm transition-colors duration-200"
                >
                  Contact
                </Link>
              </li>
              <li>
                <Link
                  to="/login"
                  className="text-gray-600 hover:text-primary-600 text-sm transition-colors duration-200"
                >
                  Members Login
                </Link>
              </li>
            </ul>
          </div>

          {/* Services */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wider">Services</h3>
            <ul className="space-y-2 text-sm text-gray-600">
              <li>Steel Importing & Supply</li>
              <li>Industrial Solutions</li>
              <li>Construction Materials</li>
              <li>Manufacturing Support</li>
              <li>Oil & Gas Industry</li>
            </ul>
          </div>
        </div>

        {/* Bottom Section */}
        <div className="mt-8 pt-8 border-t border-gray-200">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <p className="text-gray-500 text-sm">© {currentYear} Ultimate Steels. All rights reserved.</p>
            <p className="text-gray-500 text-sm mt-2 md:mt-0">Serving UAE, Dubai, Abu Dhabi, Sharjah & GCC Countries</p>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default MarketingFooter;
