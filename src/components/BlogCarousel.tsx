import { motion } from "framer-motion";
import { ArrowRight, ExternalLink } from "lucide-react";

const blogUrl = "https://www.redsaludmentalargentina.com/blog";

const blogPosts = [
  {
    title: "Ley de Salud Mental en Argentina: qué establece la norma vigente y qué cambios propone el Gobierno",
    category: "Actualidad legal",
    reference: "Temas legales y actualidad en Argentina",
    url: blogUrl,
  },
  {
    title: "¿Es pereza o es TDAH? La neurobiología de la voluntad y la Disfunción Ejecutiva en adultos",
    category: "Neurociencias",
    reference: "Neurociencias y diagnóstico",
    url: blogUrl,
  },
  {
    title: "NEUROBIOLOGÍA DE LOS VÍNCULOS Y SALUD MENTAL",
    category: "Vínculos",
    reference: "Relaciones interpersonales desde la ciencia",
    url: blogUrl,
  },
  {
    title: "Salud Mental y Relaciones: Por qué tus vínculos son el espejo de tu cerebro (y cómo usar la 'Corregulación' para sanar)",
    category: "Herramientas terapéuticas",
    reference: "Herramientas terapéuticas y neurobiología social",
    url: blogUrl,
  },
];

export default function BlogCarousel() {
  return (
    <section className="pt-2 pb-4">
      <div className="flex items-center justify-between px-6 mb-3">
        <h2 className="font-display text-[11px] font-medium uppercase tracking-widest text-muted-foreground">
          Blog RESMA
        </h2>
        <a
          href={blogUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1 text-[10px] font-display font-medium text-accent"
        >
          Ver todo
          <ArrowRight size={12} />
        </a>
      </div>

      <div className="flex gap-3 overflow-x-auto px-6 pb-2 scrollbar-hide" style={{ scrollbarWidth: "none" }}>
        {blogPosts.map((post, i) => (
          <motion.a
            key={i}
            href={post.url}
            target="_blank"
            rel="noopener noreferrer"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.06 }}
            whileTap={{ scale: 0.97 }}
            className="flex w-[280px] shrink-0 flex-col justify-between rounded-3xl border border-border/50 bg-card p-4 shadow-sm transition-shadow hover:shadow-md"
          >
            <div>
              <span className="inline-block rounded-full bg-muted px-2.5 py-0.5 text-[9px] font-display font-medium text-muted-foreground">
                {post.category}
              </span>
              <p className="mt-2.5 font-display text-[13px] font-semibold leading-snug text-foreground">
                {post.title}
              </p>
              <p className="mt-2 text-[11px] leading-relaxed text-muted-foreground">{post.reference}</p>
            </div>
            <div className="mt-2.5 flex items-center justify-between gap-3 border-t border-border/60 pt-2.5">
              <span className="text-[10px] text-muted-foreground">Blog RESMA</span>
              <span className="flex items-center gap-1 text-[10px] font-display font-semibold text-accent">
                Leer más
                <ExternalLink size={12} aria-hidden="true" />
              </span>
            </div>
          </motion.a>
        ))}
      </div>
    </section>
  );
}
