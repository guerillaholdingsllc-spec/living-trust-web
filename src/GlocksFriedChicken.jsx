const shopifyUrl = "https://glocks-fried-chicken.myshopify.com";
const shopifyWaitlistUrl = `${shopifyUrl}?utm_source=trustchain&utm_medium=landing_page&utm_campaign=glocks_fried_chicken_local_drop_waitlist`;

const productCatalog = [
  ["Glocks & Fried Chicken Classic Logo Tee", "Core logo tee and first-buyer staple.", "classic-logo-tee.png", "$31.99"],
  ["Gloxsie Character Tee", "Character-led graphic tee for personality-driven drops.", "gloxsie-character-tee.png", "$34.99"],
  ["Bobo Character Tee", "Cream/neutral character tee with bold front graphic.", "bobo-character-tee.png", "$34.99"],
  ["Character Grid Tee", "Full character lineup tee for fans of the whole Glocks & Fried Chicken universe.", "character-grid-tee.png", "$38.99"],
  ["Women's Fitted Logo Tee", "Fitted logo tee with boutique front/back layout.", "womens-fitted-tee.png", "$32.99"],
  ["Women's Crop Logo Tee", "Cropped logo tee built for local-drop fit checks.", "womens-crop-tee.png", "$34.99"],
  ["Premium Oversized Tee", "Higher-ticket streetwear tee with vintage logo treatment.", "premium-oversized-tee.png", "$44.99"],
  ["Youth Logo Tee", "Kids logo tee for family-friendly merch bundles.", "youth-logo-tee.png", "$26.99"],
  ["Youth Character Tee", "Kids character tee using the full lineup.", "youth-character-tee.png", "$28.99"],
  ["Toddler Cuppy Tee", "Toddler tee featuring Cuppy.", "toddler-cuppy-tee.png", "$24.99"],
  ["Glocks & Fried Chicken Hoodie", "Adult hoodie with front logo and larger back character artwork.", "adult-hoodie.png", "$64.99"],
  ["Youth Logo Hoodie", "Kids hoodie with centered Glocks & Fried Chicken logo print.", "youth-hoodie.png", "$54.99"],
  ["Vintage Logo Crewneck", "Ash gray crewneck with distressed circular logo print.", "crewneck-sweatshirt.png", "$58.99"],
  ["Logo Dad Hat", "Black dad hat with simplified logo patch.", "dad-hat.png", "$34.99"],
  ["Logo Beanie", "Black knit beanie with small logo patch.", "beanie.png", "$31.99"],
  ["Character Sticker Pack", "Entry-price sticker pack featuring the logo and six character stickers.", "sticker-pack.png", "$11.99"]
];

const featuredProducts = productCatalog.filter(([name]) => [
  "Glocks & Fried Chicken Hoodie",
  "Premium Oversized Tee",
  "Character Grid Tee",
  "Character Sticker Pack"
].includes(name));

const asset = (path) => `${import.meta.env.BASE_URL}${path.replace(/^\//, "")}`;

export default function GlocksFriedChicken() {
  document.title = "Glocks & Fried Chicken Local Drop";

  return (
    <main className="gfcPage">
      <section className="gfcHero" style={{ backgroundImage: `linear-gradient(90deg, #0b0b0ee8, #111114cc 45%, #11111444), url("${asset("/gafc/local-drop-hero-bg.png")}")` }}>
        <nav className="gfcNav">
          <img src={asset("/gafc/glocks-fried-chicken-logo.png")} alt="Glocks & Fried Chicken logo" />
          <a href={shopifyWaitlistUrl}>Join the waiting list</a>
        </nav>
        <div className="gfcHeroContent">
          <span>Waitlist-first local merch drop</span>
          <h1>Glocks & Fried Chicken</h1>
          <p>The first local merch drop is being built from demand. Join the waiting list, tell us what pieces and sizes you want, and get first access before the public local drop.</p>
          <div className="gfcActions">
            <a className="gfcPrimary" href={shopifyWaitlistUrl}>Join the local drop list</a>
            <a className="gfcSecondary" href="#catalog">Preview the catalog</a>
          </div>
        </div>
      </section>

      <section className="gfcSignalBar" aria-label="Glocks & Fried Chicken drop process">
        <div><strong>1</strong><span>Join the waitlist</span></div>
        <div><strong>2</strong><span>Vote on products and sizes</span></div>
        <div><strong>3</strong><span>Winning pieces get ordered</span></div>
        <div><strong>4</strong><span>Local drop opens to the list first</span></div>
      </section>

      <section className="gfcSection gfcIntro">
        <div>
          <span className="gfcEyebrow">Built from signal, not guesses</span>
          <h2>The waiting list decides what gets ordered first.</h2>
          <p>Glocks & Fried Chicken is starting lean: campaign the mockups, collect real demand, then order the products people actually want for the local drop. No fake scarcity, no pretending inventory exists before it does.</p>
        </div>
        <div className="gfcDropCard">
          <h3>Current campaign goal</h3>
          <p>Build enough qualified interest to choose products, sizes, and quantities for the first local drop.</p>
          <ul>
            <li>Product votes</li>
            <li>Size requests</li>
            <li>Waiting-list signups</li>
            <li>Local-drop interest</li>
          </ul>
        </div>
      </section>

      <section className="gfcSection" id="catalog">
        <div className="gfcSectionHeader">
          <span className="gfcEyebrow">First drop candidates</span>
          <h2>Featured pieces for the opening push.</h2>
        </div>
        <div className="gfcFeatureGrid">
          {featuredProducts.map(([name, description, image, price]) => (
            <article className="gfcFeatureCard" key={name}>
              <img src={asset(`/gafc/mockups/${image}`)} alt={`${name} rendering`} />
              <div>
                <h3>{name}</h3>
                <p>{description}</p>
                <strong>{price}</strong>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="gfcSection">
        <div className="gfcSectionHeader">
          <span className="gfcEyebrow">Full catalog preview</span>
          <h2>Tell us what should make the local order.</h2>
        </div>
        <div className="gfcCatalog">
          {productCatalog.map(([name, description, image, price]) => (
            <article className="gfcProduct" key={name}>
              <img src={asset(`/gafc/mockups/${image}`)} alt={`${name} catalog rendering`} />
              <div>
                <h3>{name}</h3>
                <p>{description}</p>
                <strong>{price}</strong>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="gfcSection gfcCta">
        <img src={asset("/gafc/glocks-fried-chicken-logo.png")} alt="Glocks & Fried Chicken logo" />
        <div>
          <span className="gfcEyebrow">First access before public drop</span>
          <h2>Get on the list before the order is planned.</h2>
          <p>Your signup helps decide what gets ordered for the local drop. The list gets first access when the drop details are locked.</p>
          <a className="gfcPrimary" href={shopifyWaitlistUrl}>Join the local drop waiting list</a>
        </div>
      </section>

      <footer className="gfcFooter">
        Glocks & Fried Chicken is a merch and character-brand project. Campaigns are for apparel and collectibles only.
      </footer>
    </main>
  );
}
