import Link from 'next/link'
import Button from '@/components/ui/Button'

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-4 bg-background relative overflow-hidden">
      {/* Decorative background */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-3xl h-full max-h-[800px] bg-primary/5 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md space-y-8 solid-card p-8 md:p-10 rounded-[2rem] animate-in fade-in zoom-in-95 duration-500 relative z-10 text-center">
        <div className="flex items-center justify-center space-x-2">
          <h1 className="text-8xl font-black text-transparent bg-clip-text bg-gradient-to-r from-primary to-primary/50 tracking-tighter">
            404
          </h1>
        </div>

        <div className="space-y-4">
          <h2 className="text-2xl font-bold tracking-tight text-foreground">
            Page not found
          </h2>
          <p className="text-muted-foreground">
            Sorry, we couldn&apos;t find the page you&apos;re looking for. It might have been removed, renamed, or didn&apos;t exist in the first place.
          </p>
        </div>

        <div className="pt-4 flex flex-col space-y-3">
          <Link href="/" passHref className="w-full">
            <Button className="w-full" size="lg">
              Go back home
            </Button>
          </Link>
          <Link href="/dashboard" passHref className="w-full">
            <Button variant="outline" className="w-full" size="lg">
              Go to Dashboard
            </Button>
          </Link>
        </div>
      </div>
    </div>
  )
}
