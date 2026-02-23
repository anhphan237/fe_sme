import { AppRouters } from '@/constants';
import { useAppSelector } from '@/stores';
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

import CtaSection from './components/CtaSection';
import FeaturesSection from './components/FeaturesSection';
import HeroSection from './components/HeroSection';
import HomeFooter from './components/HomeFooter';
import HomeHeader from './components/HomeHeader';
import HowItWorksSection from './components/HowItWorksSection';
import PricingSection from './components/PricingSection';
import ProblemSection from './components/ProblemSection';
import TestimonialsSection from './components/TestimonialsSection';

const HomePage = () => {
    const navigate = useNavigate();
    const { logged, menuList, onboardingStep } = useAppSelector(state => state.user);
    useEffect(() => {
        if (!logged) return;
        if (onboardingStep && onboardingStep !== 'done') {
            const STEP_ROUTE: Record<string, string> = {
                org_setup: AppRouters.ORG_SETUP,
                plan_selection: AppRouters.PLAN_SELECTION,
            };
            navigate(STEP_ROUTE[onboardingStep] ?? AppRouters.ORG_SETUP);
        } else if (menuList?.length) {
            navigate(menuList[0].path);
        }
    }, [logged, menuList, onboardingStep, navigate]);

    return (
        <div className="min-h-screen flex flex-col">
            <HomeHeader />
            <main className="flex-1">
                <HeroSection />
                <ProblemSection />
                <FeaturesSection />
                <HowItWorksSection />
                <PricingSection />
                <TestimonialsSection />
                <CtaSection />
            </main>
            <HomeFooter />
        </div>
    );
};

export default HomePage;
