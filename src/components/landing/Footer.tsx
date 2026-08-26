import { useShopSettings } from "@/lib/ShopSettings";

export default function Footer() {
  const settings = useShopSettings();
  return (
    <footer className="bg-coffee-dark text-coffee-cream py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid md:grid-cols-4 gap-8">
          <div>
            <h3 className="text-2xl font-bold text-coffee-accent mb-4">{settings.shop_name}</h3>
            <p className="text-coffee-secondary">
              Premium coffee experience crafted with passion.
            </p>
          </div>
          <div>
            <h4 className="font-semibold mb-4">Quick Links</h4>
            <ul className="space-y-2 text-coffee-secondary">
              <li><a href="#home" className="hover:text-coffee-accent transition">Home</a></li>
              <li><a href="#menu" className="hover:text-coffee-accent transition">Menu</a></li>
              <li><a href="#about" className="hover:text-coffee-accent transition">About</a></li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold mb-4">Hours</h4>
            <ul className="space-y-2 text-coffee-secondary">
              <li>{settings.opening_hours}</li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold mb-4">We Accept</h4>
            <div className="flex flex-wrap gap-3 items-center">
              <img src="/gcash.png" alt="GCash" className="h-8 w-auto" />
              <img src="/maya.png" alt="Maya" className="h-8 w-auto" />
              <img src="/credit card.jpg" alt="Credit Card" className="h-8 w-auto" />
              <img src="/cash.jpg" alt="Cash" className="h-8 w-auto" />
            </div>
          </div>
        </div>
        <div className="border-t border-coffee-secondary/20 mt-8 pt-8 text-center text-coffee-secondary">
          <p>&copy; 2026 {settings.shop_name}. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
