import SEOMeta from "../utils/seo";
import Hero from "../components/home/Hero";
import TrustStrip from "../components/home/TrustStrip";
import FeaturedProducts from "../components/home/FeaturedProducts";
import Categories from "../components/home/Categories";
import PromoBanner from "../components/home/PromoBanner";
import Testimonials from "../components/home/Testimonials";
import Newsletter from "../components/home/Newsletter";
import { getCanonicalUrl } from "../utils/seoConfig";

export default function Home() {
  return (
    <>
      <SEOMeta
        title="Premium Beauty & Skincare Products"
        description="Discover premium Nigerian beauty and skincare products. Shop our collections of cleansers, moisturizers, treatments, and more for healthy glowing skin."
        canonical={getCanonicalUrl("/")}
      />
      <Hero />
      <TrustStrip />
      <FeaturedProducts />
      <Categories />
      <PromoBanner />
      <Testimonials />
      <Newsletter />
    </>
  );
}
