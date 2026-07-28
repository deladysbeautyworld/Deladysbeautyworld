import Hero from "../components/home/Hero";
import TrustStrip from "../components/home/TrustStrip";
import FeaturedProducts from "../components/home/FeaturedProducts";
import Categories from "../components/home/Categories";
import PromoBanner from "../components/home/PromoBanner";
import Testimonials from "../components/home/Testimonials";
import Newsletter from "../components/home/Newsletter";
import { useNavigate } from "react-router-dom";

export default function Home() {
  const navigate = useNavigate();
  return (
    <>
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
