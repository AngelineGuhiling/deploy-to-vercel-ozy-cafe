import { useShopSettings } from "@/lib/ShopSettings";

export default function Hero() {
  const settings = useShopSettings();
  return (
    <section id="home" className="relative min-h-screen flex items-center justify-center overflow-hidden">
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: "url('/hero.jpg')" }}
      />
      <div className="absolute inset-0 bg-coffee-dark/70" />
      <div className="absolute inset-0 opacity-20">
        <div className="absolute top-20 left-20 w-72 h-72 bg-coffee-accent rounded-full blur-3xl"></div>
        <div className="absolute bottom-20 right-20 w-96 h-96 bg-coffee-secondary rounded-full blur-3xl"></div>
      </div>
      <div className="relative z-10 text-center px-4 max-w-4xl mx-auto">
        <h1 className="text-5xl md:text-7xl font-bold text-coffee-cream mb-6 drop-shadow-lg">
          Welcome to <span className="text-coffee-accent">{settings.shop_name}</span>
        </h1>
        <p className="text-xl md:text-2xl text-coffee-cream/80 mb-8 drop-shadow">
          Premium coffee experience crafted with passion and precision
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <a href="#menu" className="bg-coffee-accent text-coffee-dark px-8 py-3 rounded-lg font-semibold text-lg hover:bg-coffee-secondary transition transform hover:scale-105 shadow-lg">
            View Menu
          </a>
          <a href="#about" className="border-2 border-coffee-accent text-coffee-accent px-8 py-3 rounded-lg font-semibold text-lg hover:bg-coffee-accent hover:text-coffee-dark transition shadow-lg">
            About Us
          </a>
        </div>
      </div>
      <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 animate-bounce">
        <svg className="w-6 h-6 text-coffee-cream" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
        </svg>
      </div>
    </section>
  );
}
