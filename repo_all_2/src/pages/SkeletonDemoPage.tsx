import AnimatedLoadingSkeleton from "@/src/components/ui/animated-loading-skeleton";

export function SkeletonDemo() {
    return (
        <div className="min-h-screen bg-background p-8 flex flex-col items-center justify-center gap-8">
            <h1 className="text-3xl font-bold text-white">Animated Loading Skeleton Demo</h1>
            <AnimatedLoadingSkeleton />
        </div>
    );
}

export default SkeletonDemo;
