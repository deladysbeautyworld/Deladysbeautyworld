import NavBar from './components/NavBar';
import Hero from './components/Hero';
import Truststrip from './components/Truststrip';
import Featuredproducts from './components/Featuredproducts';
import Categories from './components/Categories';
import Promobanner from './components/Promobanner';
import Testimonials from './components/Testimonials';
import Newsletter from './components/Newsletter';
import Footer from './components/Footer';

function App() {
  return (
    <>
      <NavBar />

      <main>
        <Hero />
        <Truststrip />
        <Featuredproducts />
        <Categories/>
        <Promobanner />
        <Testimonials />
        <Newsletter />
        <Footer />
      </main>
    </>
  )
}

export default App