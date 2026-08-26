import { useShopSettings } from "@/lib/ShopSettings";

export default function About() {
  const settings = useShopSettings();
  return (
    <section id="about" className="py-20 bg-coffee-dark">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-coffee-cream mb-4">About {settings.shop_name}</h2>
          <p className="text-coffee-secondary text-lg max-w-2xl mx-auto">
            More than just coffee &mdash; we build community, create opportunities, and serve with heart.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8 mb-12">
          <div className="bg-gradient-to-br from-coffee-primary to-coffee-dark rounded-3xl p-8 border border-coffee-secondary/20">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-coffee-accent/20 rounded-xl flex items-center justify-center">
                <svg className="w-6 h-6 text-coffee-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
              </div>
              <h3 className="text-2xl font-bold text-coffee-accent">Our Vision</h3>
            </div>
            <p className="text-coffee-cream/80 text-lg leading-relaxed">
              To become a successful and trusted coffee shop that not only serves quality products and
              excellent customer experiences but also becomes a blessing to others by creating employment
              opportunities, supporting the community, and continuously growing through future business expansion.
            </p>
          </div>

          <div className="bg-gradient-to-br from-coffee-accent to-coffee-primary rounded-3xl p-8 border border-coffee-secondary/20">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-coffee-dark/20 rounded-xl flex items-center justify-center">
                <svg className="w-6 h-6 text-coffee-cream" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                </svg>
              </div>
              <h3 className="text-2xl font-bold text-coffee-cream">Our Mission</h3>
            </div>
            <p className="text-coffee-cream/80 text-lg leading-relaxed">
              Our mission is to serve high-quality and affordable products while providing excellent
              customer service in a welcoming environment. We are committed to growing our business
              through continuous improvement and creating job opportunities through future expansion.
            </p>
          </div>
        </div>

      </div>
    </section>
  );
}
