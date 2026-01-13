import React from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs) {
    return twMerge(clsx(inputs));
}

export const Button = React.forwardRef(({ className, variant = "primary", size = "default", ...props }, ref) => {
    const variants = {
        primary: "bg-indigo-600 text-white hover:bg-indigo-700 shadow-[0_0_15px_rgba(79,70,229,0.3)] border border-indigo-500/20",
        secondary: "bg-zinc-800 text-zinc-100 hover:bg-zinc-700 border border-zinc-700",
        ghost: "hover:bg-zinc-800/50 hover:text-white text-zinc-400",
        destructive: "bg-red-900/50 text-red-200 hover:bg-red-900/70 border border-red-900",
        outline: "border border-zinc-700 bg-transparent hover:bg-zinc-800 text-zinc-100"
    };
    const sizes = {
        default: "h-10 px-4 py-2",
        sm: "h-8 rounded-md px-3 text-xs",
        lg: "h-12 rounded-md px-8 text-base",
        icon: "h-10 w-10 flex items-center justify-center"
    };
    return (
        <button ref={ref} className={cn("inline-flex items-center justify-center whitespace-nowrap rounded-lg text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 active:scale-95", variants[variant], sizes[size], className)} {...props} />
    );
});

export const Card = ({ className, ...props }) => (
    <div className={cn("rounded-xl border border-zinc-800 bg-zinc-950/50 text-card-foreground shadow-sm backdrop-blur-sm", className)} {...props} />
);

export const Input = React.forwardRef(({ className, ...props }, ref) => (
    <input ref={ref} className={cn("flex h-10 w-full rounded-md border border-zinc-800 bg-zinc-900/50 px-3 py-2 text-sm text-zinc-100 ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-zinc-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 focus-visible:ring-offset-black disabled:cursor-not-allowed disabled:opacity-50 transition-all", className)} {...props} />
));

export const Label = ({ className, ...props }) => (
    <label className={cn("text-xs font-medium uppercase tracking-wider text-zinc-500", className)} {...props} />
);
