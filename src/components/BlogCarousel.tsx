import { motion } from "framer-motion";
import { ArrowRight, ExternalLink } from "lucide-react";

const blogPosts = [
  {
    title: "¿Qué es la psicoterapia y cómo puede ayudarte?",
    category: "Psicoterapia",
    date: "10 Abr 2026",
    url: "https://www.redsaludmentalargentina.com/blog",
  },
  {
    title: "Ansiedad: señales que tu cuerpo te está dando",
    category: "Bienestar",
    date: "3 Abr 2026",
    url: "https://www.redsaludmentalargentina.com/blog",
  },
  {
    title: "Autocuidado en tiempos de crisis: guía práctica",
    category: "Autocuidado",
    date: "28 Mar 2026",
    url: "https://www.redsaludmentalargentina.com/blog",
  },
  {
    title: "El vínculo terapéutico: por qué importa tanto",
    category: "Psicoanálisis",
    date: "20 Mar 2026",
    url: "https://www.redsaludmentalargentina.com/blog",
  },
];

const categoryColors: Record<string, string> = {
  Psicoterapia: "bg-[hsl(250_40%_94%)] text-[hsl(250_40%_45%)]",
  Bienestar: "bg-[hsl(150_30%_93%)] text-[hsl(150_30%_40%)]",
  Autocuidado: "bg-[hsl(35_50%_93%)] text-[hsl(35_50%_40%)]",
  Psicoanálisis: "bg-[hsl(200_35%_93%)] text-[hsl(200_35%_42%)]",
};

export default function BlogCarousel() {
  return (
    <section className="pt-2 pb-4">
      <div className="flex items-center justify-between px-6 mb-3">
        <h2 className="font-display text-[11px] font-medium uppercase tracking-widest text-muted-foreground">
          Blog RESMA
        </h2>
        <a
          href="https://www.redsaludmentalargentina.com/blog"
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
            className="flex w-[200px] shrink-0 flex-col justify-between rounded-3xl border border-border/50 bg-card p-4 shadow-sm transition-shadow hover:shadow-md"
          >
            <div>
              <span
                className={`inline-block rounded-full px-2.5 py-0.5 text-[9px] font-display font-medium ${
                  categoryColors[post.category] || "bg-muted text-muted-foreground"
                }`}
              >
                {post.category}
              </span>
              <p className="mt-2.5 font-display text-[13px] font-semibold leading-snug text-foreground line-clamp-3">
                {post.title}
              </p>
            </div>
            <div className="mt-3 flex items-center justify-between">
              <span className="text-[10px] text-muted-foreground">{post.date}</span>
              <ExternalLink size={12} className="text-muted-foreground/60" />
            </div>
          </motion.a>
        ))}
      </div>
    </section>
  );
}
