import { Cards, Card } from "fumadocs-ui/components/card";
import {
  BookOpen,
  Heart,
  CircleHelp,
  House,
  MessageCircle,
  Rocket,
  Search,
  Shield,
} from "lucide-react";
import Link from "next/link";

export default function HomePage() {
  return (
    <div className="flex flex-1 flex-col items-center px-4 py-16">
      <div className="mx-auto max-w-4xl text-center">
        <div className="mb-6 flex justify-center">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            className="size-16"
            aria-hidden
          >
            <path
              fill="#0D9488"
              d="M 10.681641,2.7070313 C 9.5898446,3.0870406 8.9226459,3.9248237 7.6875,5.296875 l -5.4316406,6.035156 a 1,1 0 0 0 0.076172,1.41211 1,1 0 0 0 1.4121093,-0.07617 L 4,12.382813 v 3.816406 c 0,1.68 -0.051562,2.660845 0.4355469,3.617187 0.383932,0.7532 0.9973271,1.364701 1.7480468,1.748047 C 7.1399362,22.051562 8.1207812,22 9.8007813,22 H 10 h 4 0.199219 c 1.68,0 2.660845,0.05156 3.617187,-0.435547 0.752366,-0.383507 1.36454,-0.995681 1.748047,-1.748047 C 20.051562,18.860064 20,17.879219 20,16.199219 v -3.814453 l 0.255859,0.285156 a 1,1 0 0 0 1.414063,0.07422 1,1 0 0 0 0.07422,-1.414063 L 16.310547,5.2949219 C 15.07506,3.922492 14.406276,3.0868902 13.316406,2.7070313 c -0.85165,-0.2972113 -1.781049,-0.2967707 -2.632812,0 z m 0.658203,1.8886718 a 1.0001,1.0001 0 0 0 0.002,0 c 0.425718,-0.1485682 0.888735,-0.1485682 1.314453,0 a 1.0001,1.0001 0 0 0 0.002,0 c 0.363201,0.1263958 0.930097,0.6641991 2.166016,2.0371094 L 18,10.162109 v 6.03711 c 0,1.68 -0.05186,2.381327 -0.21875,2.708984 -0.192493,0.377635 -0.495412,0.680554 -0.873047,0.873047 C 16.6774,19.898809 15.812831,19.910262 15,19.935547 V 15 a 1.0001,1.0001 0 0 0 -1,-1 h -4 a 1.0001,1.0001 0 0 0 -1,1 v 4.935547 C 8.187169,19.910262 7.3226002,19.898809 7.0917969,19.78125 6.7156787,19.588526 6.4103893,19.284162 6.21875,18.908203 6.051859,18.580546 6,17.879219 6,16.199219 v -6.03711 L 9.1738281,6.6347656 C 10.410088,5.2614766 10.976573,4.7219496 11.339844,4.5957031 Z M 11,16 h 2 v 4 h -2 z"
            />
          </svg>
        </div>
        <h1 className="mb-4 text-4xl font-bold tracking-tight text-fd-foreground">
          OpenHospi Documentatie
        </h1>
        <p className="mx-auto mb-12 max-w-2xl text-lg text-fd-muted-foreground">
          Alles wat je moet weten over het vinden of aanbieden van een studentenkamer. Gratis,
          veilig en alleen voor studenten.
        </p>

        <Cards>
          <Card icon={<Rocket />} href="docs/aan-de-slag" title="Aan de slag">
            Account aanmaken, profiel instellen en direct beginnen.
          </Card>
          <Card icon={<Search />} href="docs/kamer-zoeken" title="Kamer zoeken">
            Zoek, filter en reageer op beschikbare kamers.
          </Card>
          <Card icon={<House />} href="docs/kamer-aanbieden" title="Kamer aanbieden">
            Plaats een listing en beheer je kameraanbod.
          </Card>
          <Card icon={<MessageCircle />} href="docs/chat" title="Chat & Berichten">
            Communiceer veilig met end-to-end encryptie.
          </Card>
          <Card icon={<Shield />} href="docs/privacy-en-veiligheid" title="Privacy & Veiligheid">
            Hoe we je gegevens beschermen en veiligheidstips.
          </Card>
          <Card icon={<CircleHelp />} href="docs/veelgestelde-vragen" title="Veelgestelde vragen">
            Antwoorden op de meest gestelde vragen.
          </Card>
          <Card icon={<Heart />} href="docs/sponsors" title="Sponsors & Partners">
            Hoe OpenHospi gratis kan blijven.
          </Card>
        </Cards>

        <div className="mt-12">
          <Link
            href="docs"
            className="inline-flex items-center gap-2 rounded-md bg-fd-primary px-5 py-2.5 text-sm font-medium text-fd-primary-foreground transition-colors hover:bg-fd-primary/90"
          >
            <BookOpen className="size-4" />
            Bekijk alle documentatie
          </Link>
        </div>
      </div>
    </div>
  );
}
