import Link from "next/link";
import {
  MapPin,
  Clock,
  DollarSign,
  Star,
  Compass,
  ArrowRight,
  Sun,
  ShieldAlert,
  Car,
  Utensils,
  Building,
  Plane,
  Train,
  Bus,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Destination,
  Attraction,
  Hotel,
  Restaurant,
  TransportOption,
  TaxiOption,
} from "@/types/travel";
import { PlaceComfortBadge } from "@/components/travel/place-comfort-badge";

export function DemoBadge({ className }: { className?: string }) {
  return (
    <Badge
      variant="outline"
      className={`bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/30 text-[10px] font-bold tracking-wider uppercase px-2 py-0.5 gap-1 ${className}`}
    >
      <ShieldAlert className="w-3 h-3 text-amber-500" />
      DEMO DATA
    </Badge>
  );
}

export function DestinationCard({ destination }: { destination: Destination }) {
  return (
    <Card className="flex flex-col h-full overflow-hidden hover:shadow-lg transition-all group">
      <div className="relative h-44 w-full bg-muted overflow-hidden">
        {destination.hero_image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={destination.hero_image}
            alt={destination.name}
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-primary/10 text-primary">
            <Compass className="w-10 h-10" />
          </div>
        )}
        <div className="absolute top-3 right-3">
          <DemoBadge />
        </div>
        <div className="absolute bottom-3 left-3">
          <Badge className="bg-black/70 backdrop-blur text-white border-0 text-xs">
            {destination.climate}
          </Badge>
        </div>
      </div>

      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-xl group-hover:text-primary transition-colors">
            {destination.name}
          </CardTitle>
          <span className="text-xs text-muted-foreground">
            {destination.state_province}
          </span>
        </div>
        <CardDescription className="line-clamp-2 text-xs">
          {destination.description}
        </CardDescription>
      </CardHeader>

      <CardContent className="flex-1 space-y-2 text-xs text-muted-foreground pt-1">
        <div className="flex items-center gap-1.5">
          <Sun className="w-3.5 h-3.5 text-amber-500" />
          <span>Best Time: {destination.best_time_to_visit}</span>
        </div>
        <div className="flex items-center gap-1.5 text-muted-foreground/80">
          <MapPin className="w-3.5 h-3.5" />
          <span>
            {destination.latitude.toFixed(4)}°N, {destination.longitude.toFixed(4)}°E
          </span>
        </div>
      </CardContent>

      <CardFooter className="pt-2 border-t">
        <Button variant="ghost" size="sm" asChild className="w-full justify-between">
          <Link href={`/explore/destinations/${destination.id}`}>
            Explore Guide & Activities
            <ArrowRight className="w-4 h-4 ml-1" />
          </Link>
        </Button>
      </CardFooter>
    </Card>
  );
}

export function AttractionCard({ attraction }: { attraction: Attraction }) {
  return (
    <Card className="flex flex-col h-full hover:shadow-md transition-shadow">
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between gap-2">
          <Badge variant="secondary" className="text-xs">
            {attraction.category}
          </Badge>
          <DemoBadge />
        </div>
        <CardTitle className="text-lg mt-2">{attraction.name}</CardTitle>
        <CardDescription className="text-xs line-clamp-2">
          {attraction.description}
        </CardDescription>
      </CardHeader>

      <CardContent className="flex-1 space-y-2.5 text-xs text-muted-foreground">
        <div className="grid grid-cols-2 gap-2 p-2 rounded-lg bg-muted/40">
          <div>
            <span className="block text-[10px] uppercase font-semibold text-muted-foreground">
              Opening Hours
            </span>
            <span>
              {attraction.opening_time} - {attraction.closing_time}
            </span>
          </div>
          <div>
            <span className="block text-[10px] uppercase font-semibold text-muted-foreground">
              Ticket Price
            </span>
            <span className="font-semibold text-foreground">
              {attraction.ticket_price === 0
                ? "Free Entry"
                : `₹${attraction.ticket_price} ${attraction.currency}`}
            </span>
          </div>
        </div>

        <div className="flex items-center justify-between text-xs">
          <span className="flex items-center gap-1">
            <Clock className="w-3.5 h-3.5" />
            Rec. Visit: {attraction.recommended_visit_minutes} mins
          </span>
          <span className="text-emerald-600 dark:text-emerald-400">
            {attraction.weather_suitability}
          </span>
        </div>

        <PlaceComfortBadge
          placeId={attraction.id}
          placeName={attraction.name}
          category={attraction.category}
          latitude={attraction.latitude}
          longitude={attraction.longitude}
          variant="banner"
        />
      </CardContent>
    </Card>
  );
}

export function HotelCard({ hotel }: { hotel: Hotel }) {
  return (
    <Card className="flex flex-col h-full hover:shadow-md transition-shadow">
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-1 text-amber-500 font-semibold text-sm">
            <Star className="w-4 h-4 fill-amber-500" />
            <span>{hotel.rating.toFixed(1)}</span>
          </div>
          <DemoBadge />
        </div>
        <CardTitle className="text-lg mt-1 flex items-center gap-1.5">
          <Building className="w-4 h-4 text-primary" />
          {hotel.name}
        </CardTitle>
      </CardHeader>

      <CardContent className="flex-1 space-y-3 text-xs text-muted-foreground">
        <div className="flex items-baseline justify-between py-2 border-b">
          <span className="text-muted-foreground">Nightly Rate</span>
          <span className="text-lg font-bold text-foreground">
            ₹{hotel.price_per_night.toLocaleString()}
            <span className="text-xs font-normal text-muted-foreground"> / night</span>
          </span>
        </div>

        <div>
          <span className="text-[10px] uppercase font-semibold text-muted-foreground block mb-1">
            Amenities
          </span>
          <div className="flex flex-wrap gap-1">
            {hotel.amenities.map((a, i) => (
              <Badge key={i} variant="outline" className="text-[10px] font-normal">
                {a}
              </Badge>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export function RestaurantCard({ restaurant }: { restaurant: Restaurant }) {
  return (
    <Card className="flex flex-col h-full hover:shadow-md transition-shadow">
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between gap-2">
          <Badge variant="secondary">{restaurant.price_level}</Badge>
          <DemoBadge />
        </div>
        <CardTitle className="text-lg mt-1 flex items-center gap-1.5">
          <Utensils className="w-4 h-4 text-emerald-600" />
          {restaurant.name}
        </CardTitle>
        <CardDescription className="text-xs">{restaurant.cuisine}</CardDescription>
      </CardHeader>

      <CardContent className="flex-1 space-y-2.5 text-xs text-muted-foreground">
        <div className="flex items-center justify-between py-1.5 border-b">
          <span>Est. Cost / Person</span>
          <span className="font-semibold text-foreground">
            ₹{restaurant.estimated_price_per_person}
          </span>
        </div>

        <div>
          <span className="text-[10px] uppercase font-semibold text-muted-foreground block mb-1">
            Dietary Specialities
          </span>
          <div className="flex flex-wrap gap-1">
            {restaurant.dietary_options.map((d, i) => (
              <Badge key={i} variant="outline" className="text-[10px]">
                {d}
              </Badge>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export function TransportCard({ transport }: { transport: TransportOption }) {
  const getIcon = () => {
    switch (transport.mode) {
      case "flight":
        return <Plane className="w-4 h-4 text-blue-500" />;
      case "train":
        return <Train className="w-4 h-4 text-emerald-600" />;
      case "bus":
        return <Bus className="w-4 h-4 text-amber-500" />;
      default:
        return <Car className="w-4 h-4" />;
    }
  };

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-muted">{getIcon()}</div>
            <div>
              <CardTitle className="text-base">{transport.provider}</CardTitle>
              <CardDescription className="text-xs capitalize">
                {transport.mode} Route
              </CardDescription>
            </div>
          </div>
          <DemoBadge />
        </div>
      </CardHeader>

      <CardContent className="space-y-3 text-xs">
        <div className="flex items-center justify-between p-2 rounded-lg bg-muted/40">
          <div>
            <span className="text-[10px] uppercase text-muted-foreground block">
              Departure
            </span>
            <span className="font-semibold text-foreground">
              {transport.departure} ({transport.origin})
            </span>
          </div>
          <ArrowRight className="w-4 h-4 text-muted-foreground" />
          <div className="text-right">
            <span className="text-[10px] uppercase text-muted-foreground block">
              Arrival
            </span>
            <span className="font-semibold text-foreground">
              {transport.arrival} ({transport.destination})
            </span>
          </div>
        </div>

        <div className="flex items-center justify-between text-muted-foreground">
          <span>Duration: {Math.floor(transport.duration_minutes / 60)}h {transport.duration_minutes % 60}m</span>
          <span className="text-base font-bold text-foreground">
            ₹{transport.price.toLocaleString()}
          </span>
        </div>
      </CardContent>
    </Card>
  );
}

export function TaxiCard({ taxi }: { taxi: TaxiOption }) {
  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-muted">
              <Car className="w-4 h-4 text-primary" />
            </div>
            <div>
              <CardTitle className="text-base">{taxi.name}</CardTitle>
              <CardDescription className="text-xs">{taxi.vehicle_type}</CardDescription>
            </div>
          </div>
          <DemoBadge />
        </div>
      </CardHeader>

      <CardContent className="space-y-2 text-xs">
        <div className="flex justify-between py-1 border-b">
          <span className="text-muted-foreground">Base Starting Fare</span>
          <span className="font-semibold text-foreground">₹{taxi.base_fare}</span>
        </div>
        <div className="flex justify-between py-1">
          <span className="text-muted-foreground">Distance Rate</span>
          <span className="font-semibold text-foreground">₹{taxi.price_per_km} / km</span>
        </div>
      </CardContent>
    </Card>
  );
}
