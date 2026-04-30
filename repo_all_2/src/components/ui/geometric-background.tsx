"use client";

import { motion, useScroll, useTransform } from "framer-motion";
import { cn } from "@/src/lib/utils";

function ElegantShape({
    className,
    delay = 0,
    width = 400,
    height = 100,
    rotate = 0,
    gradient = "from-primary/[0.08]",
}: {
    className?: string;
    delay?: number;
    width?: number;
    height?: number;
    rotate?: number;
    gradient?: string;
}) {
    return (
        <motion.div
            initial={{
                opacity: 0,
                y: -150,
                rotate: rotate - 15,
            }}
            animate={{
                opacity: 1,
                y: 0,
                rotate: rotate,
            }}
            transition={{
                duration: 2.4,
                delay,
                ease: [0.23, 0.86, 0.39, 0.96] as any,
                opacity: { duration: 1.2 },
            }}
            className={cn("absolute", className)}
        >
            <motion.div
                animate={{
                    y: [0, 30, 0],
                    rotate: [0, 5, 0],
                }}
                transition={{
                    duration: 8,
                    repeat: Number.POSITIVE_INFINITY,
                    ease: "easeInOut",
                }}
                style={{
                    width,
                    height,
                }}
                className="relative"
            >
                <div
                    className={cn(
                        "absolute inset-0 rounded-full",
                        "bg-gradient-to-r to-transparent",
                        gradient,
                        "backdrop-blur-[2px] border-2 border-white/[0.05]",
                        "shadow-[0_8px_32px_0_rgba(0,0,0,0.2)]",
                        "after:absolute after:inset-0 after:rounded-full",
                        "after:bg-[radial-gradient(circle_at_50%_50%,rgba(255,255,255,0.05),transparent_70%)]"
                    )}
                />
            </motion.div>
        </motion.div>
    );
}

export function GeometricBackground({ className }: { className?: string }) {
    const { scrollYProgress } = useScroll();
    const y = useTransform(scrollYProgress, [0, 1], [0, -150]);

    return (
        <div className={cn("fixed inset-0 overflow-hidden pointer-events-none -z-10 bg-[#030303]", className)}>
            <div className="absolute inset-0 bg-gradient-to-br from-primary/[0.05] via-transparent to-primary/[0.05] blur-3xl" />

            <motion.div 
                style={{ y }}
                className="absolute inset-0 overflow-hidden"
            >
                <ElegantShape
                    delay={0.3}
                    width={600}
                    height={140}
                    rotate={12}
                    gradient="from-primary/[0.1]"
                    className="left-[-10%] md:left-[-5%] top-[15%] md:top-[20%]"
                />

                <ElegantShape
                    delay={0.5}
                    width={500}
                    height={120}
                    rotate={-15}
                    gradient="from-violet-500/[0.1]"
                    className="right-[-5%] md:right-[0%] top-[70%] md:top-[75%]"
                />

                <ElegantShape
                    delay={0.4}
                    width={300}
                    height={80}
                    rotate={-8}
                    gradient="from-indigo-500/[0.1]"
                    className="left-[5%] md:left-[10%] bottom-[5%] md:bottom-[10%]"
                />

                <ElegantShape
                    delay={0.6}
                    width={200}
                    height={60}
                    rotate={20}
                    gradient="from-primary/[0.1]"
                    className="right-[15%] md:right-[20%] top-[10%] md:top-[15%]"
                />

                <ElegantShape
                    delay={0.7}
                    width={150}
                    height={40}
                    rotate={-25}
                    gradient="from-violet-500/[0.1]"
                    className="left-[20%] md:left-[25%] top-[5%] md:top-[10%]"
                />
            </motion.div>
            
            <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-black/60" />
        </div>
    );
}
