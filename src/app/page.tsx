import Image from "next/image";
import Link from "next/link";
import { Monitor, Shirt, Home as HomeIcon, Sparkles } from "lucide-react";

export default function Home() {
  return (
    <div className="space-y-12">
      {/* Hero Section */}
      <section className="py-10 text-center md:text-left">
        <h1 className="text-5xl md:text-7xl font-bold leading-[1.1] tracking-tight mb-4">
          <span className="gradient-text">Shopping that doesn't suck.</span>
        </h1>
        <p className="text-slate-500 dark:text-slate-400 text-lg max-w-2xl">
          Just your money, gone. Minimalist vibes for maximum impulse.
        </p>
        
        {/* Hero Image */}
        <div className="mt-12 relative group w-full aspect-[16/9] md:aspect-[21/9]">
          <div className="absolute -inset-1 bg-gradient-to-r from-primary to-cyan-500 rounded-xl blur opacity-25 group-hover:opacity-50 transition duration-1000 group-hover:duration-200"></div>
          <div className="relative bg-white dark:bg-surface-dark rounded-xl overflow-hidden w-full h-full">
             {/* Using a placeholder or the original image URL if valid. 
                 Note: External images need hostname config in next.config.ts if optimization is on. 
                 For now using unoptimized or assuming we will add the domain. 
             */}
            <Image 
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuATYgXdAtsqpMn0IkZGytGV5ILkQGgnN8q21MPfK7rVB5U2gaKVsWpT5e1sTPkOgZGknmmabBSohh6bLLktq8k2HCEztKoJeQdKn05-BWcmOSFIgRMnAq7oJU5mh8cmNJP_iaPHA76rNhESnbDlvLkNC0elDbpV-W_h-qcgoEuuxg3AKrFMJPzBvxvxLb2S0Q_9-uuKSSpWBfXl878VP9PlWuSbRGHHoOYgR3da0k5Ltr3cBOQ7ru6TPN61ErPqq-ClctX1G0ONiDU"
                alt="Featured Headphones"
                fill
                className="object-cover"
                unoptimized
            />
          </div>
        </div>
      </section>

      {/* Featured Product */}
      <section className="grid md:grid-cols-2 gap-8 items-center py-6">
        <div className="flex flex-col gap-4 order-2 md:order-1">
          <h3 className="text-xs font-bold uppercase tracking-widest text-primary">Limited Drop</h3>
          <h2 className="text-4xl font-bold leading-tight">The Overpriced Lamp.</h2>
          <p className="text-lg text-slate-500 dark:text-slate-400 italic">It shines. Like your forehead after seeing the price.</p>
          <button className="mt-4 bg-primary hover:bg-primary/90 text-white font-bold py-3 px-8 rounded-lg text-sm w-fit transition-all">
            Acquire Now
          </button>
        </div>
        <div className="rounded-xl overflow-hidden bg-surface-dark aspect-square relative order-1 md:order-2">
           <Image
             src="https://lh3.googleusercontent.com/aida-public/AB6AXuBMTJD2Cm_gkQiZor1E7coN--VVkm4JYlVQI2ovy5_Y9u8YVEIMuglqGp-EWawnYImha5IFpp7-Tc3TgAzo8SE3xdL6fCf45LD5o7ey6_-JV5hbunXRU9nVbEN7FMCAuk4_53WwhsUH0sotuS8fJ2rTnduDmdOzUFHnWuc20gxUiTDTEEb61Cc9pn0WSk8di5d98ytTXLdHIUdF6cofZkmP9RhjJL_jKl4qc24YLf69B3Jtu1shCP-9ew7NHzjVzu557rknWuAg9ik"
             alt="Designer Lamp"
             fill
             className="object-cover"
             unoptimized
           />
        </div>
      </section>

      {/* Categories */}
      <section className="py-10">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold">The Damage</h2>
          <span className="text-primary text-sm font-medium cursor-pointer hover:underline">View all</span>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
           {[
               { name: "Electronics", desc: "Shiny distractions.", icon: Monitor },
               { name: "Fashion", desc: "Cover your regrets.", icon: Shirt },
               { name: "Smart Home", desc: "Spying on yourself.", icon: HomeIcon },
               { name: "Lifestyle", desc: "Things you don't need.", icon: Sparkles }
           ].map((cat) => (
             <div key={cat.name} className="bg-surface-dark rounded-xl p-6 flex flex-col gap-4 aspect-square justify-between border border-white/5 hover:border-primary/50 transition-colors cursor-pointer group">
               <cat.icon className="text-primary w-10 h-10 group-hover:scale-110 transition-transform" />
               <div>
                 <h4 className="font-bold text-lg">{cat.name}</h4>
                 <p className="text-xs text-slate-400">{cat.desc}</p>
               </div>
             </div>
           ))}
        </div>
      </section>
    </div>
  );
}
