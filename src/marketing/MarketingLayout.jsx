import MarketingFooter from "./MarketingFooter";
import MarketingHeader from "./MarketingHeader";

const MarketingLayout = ({ children }) => {
  return (
    <div className="min-h-screen flex flex-col overflow-x-hidden">
      <MarketingHeader />
      <main className="flex-1 overflow-y-auto overflow-x-hidden">{children}</main>
      <MarketingFooter />
    </div>
  );
};

export default MarketingLayout;
