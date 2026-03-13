import LandingNavbar from "./sections/LandingNavbar";
import LandingHero from "./sections/LandingHero";
import LandingLogos from "./sections/LandingLogos";
import LandingFeatures from "./sections/LandingFeatures";
import LandingHowItWorks from "./sections/LandingHowItWorks";
import LandingPricing from "./sections/LandingPricing";
import LandingTestimonials from "./sections/LandingTestimonials";
import LandingFAQ from "./sections/LandingFAQ";
import LandingCTA from "./sections/LandingCTA";
import LandingFooter from "./sections/LandingFooter";

const LandingPage = () => {
  return (
    <div className="min-h-screen bg-white font-sans">
      <LandingNavbar />
      <main>
        <LandingHero />
        <LandingLogos />
        <LandingFeatures />
        <LandingHowItWorks />
        <LandingPricing />
        <LandingTestimonials />
        <LandingFAQ />
        <LandingCTA />
      </main>
      <LandingFooter />
    </div>
  );
};

export default LandingPage;
