import NavBar from './components/NavBar';
import Hero from './components/Hero';
import Truststrip from './components/Truststrip';
import Featuredproducts from './components/Featuredproducts';
import Categories from './components/Categories';
import Promobanner from './components/Promobanner';

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
      </main>
    </>
  )
}

export default App