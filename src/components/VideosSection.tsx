import { Play } from "lucide-react";

const videos = [
  {
    id: 1,
    title: "CSK vs MI - Match Highlights",
    duration: "12:34",
    views: "2.5M",
    thumb: "https://images.unsplash.com/photo-1521412644187-c49fa049e84d?auto=format&fit=crop&w=1200&q=80",
    link: "https://www.iplt20.com/videos/highlights",
  },
  {
    id: 2,
    title: "Virat Kohli's Stunning Century",
    duration: "8:12",
    views: "4.1M",
    thumb: "https://images.unsplash.com/photo-1540747913346-19e32dc3e97e?auto=format&fit=crop&w=1200&q=80",
    link: "https://www.iplt20.com/videos",
  },
  {
    id: 3,
    title: "Best Catches of IPL 2026",
    duration: "6:45",
    views: "1.8M",
    thumb: "https://images.unsplash.com/photo-1624526267942-ab0ff8a3e972?auto=format&fit=crop&w=1200&q=80",
    link: "https://www.iplt20.com/videos/highlights",
  },
  {
    id: 4,
    title: "Top 10 Sixes - Week 4",
    duration: "5:30",
    views: "3.2M",
    thumb: "https://images.unsplash.com/photo-1593341646782-e0b495cff86d?auto=format&fit=crop&w=1200&q=80",
    link: "https://www.iplt20.com/videos",
  },
  {
    id: 5,
    title: "KKR vs RR - Last Over Drama",
    duration: "10:20",
    views: "2.9M",
    thumb: "https://images.unsplash.com/photo-1579952363873-27f3bade9f55?auto=format&fit=crop&w=1200&q=80",
    link: "https://www.iplt20.com/videos/highlights",
  },
  {
    id: 6,
    title: "MS Dhoni's Helicopter Shot",
    duration: "3:15",
    views: "5.6M",
    thumb: "https://images.unsplash.com/photo-1531415074968-036ba1b575da?auto=format&fit=crop&w=1200&q=80",
    link: "https://www.iplt20.com/videos",
  },
];

const VideosSection = () => {
  return (
    <section id="videos" className="py-16 px-4">
      <div className="container mx-auto">
        <h2 className="font-heading text-3xl md:text-4xl font-bold text-foreground uppercase mb-8 text-center">
          Videos & Highlights
        </h2>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {videos.map((video, index) => (
            <div
              key={video.id}
              className="group animate-fade-up"
              style={{ animationDelay: `${index * 90}ms` }}
            >
              <div className="gold-panel relative aspect-video flex items-center justify-center overflow-hidden transition-transform duration-300 group-hover:-translate-y-1">
                <img src={video.thumb} alt={video.title} className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" loading="lazy" />
                <div className="absolute inset-0 bg-black/35 group-hover:bg-black/25 transition-colors" />
                <div className="w-14 h-14 rounded-full bg-primary/90 flex items-center justify-center group-hover:scale-110 transition-transform z-10">
                  <Play className="w-6 h-6 text-primary-foreground ml-1" />
                </div>
                <span className="absolute bottom-2 right-2 text-xs bg-background/80 text-foreground px-2 py-0.5 rounded z-10">{video.duration}</span>
              </div>
              <h3 className="font-heading text-sm font-semibold text-foreground mt-3 group-hover:text-primary transition-colors">
                {video.title}
              </h3>
              <p className="text-xs text-muted-foreground">{video.views} views</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default VideosSection;
