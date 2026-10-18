/*
 * Category placeholder artwork (approved 18 October 2026): one illustration per
 * top-level group, shown when a business has no photo of its own. Every type in a
 * group uses its group's illustration. Drawn as SVG so it loads instantly.
 * The artwork is static and written by us, so it is safe to inject as markup.
 */
export interface CategoryArtwork { from: string; to: string; svg: string }

export const categoryArt: Record<string, CategoryArtwork> = {
  "transport": {
    "from": "#053F43",
    "to": "#0B8981",
    "svg": "<circle cx=\"250\" cy=\"58\" r=\"17\" fill=\"#F4B846\"/> <path d=\"M0 122 Q70 98 140 116 T320 108 V200 H0Z\" fill=\"#032F33\" opacity=\".45\"/> <rect x=\"0\" y=\"146\" width=\"320\" height=\"30\" fill=\"rgba(255,255,255,.16)\"/> <path d=\"M0 161 H320\" stroke=\"#F4B846\" stroke-width=\"2.5\" stroke-dasharray=\"14 12\" opacity=\".9\"/> <path d=\"M78 158 h104 a8 8 0 0 0 8-8 v-7 a6 6 0 0 0-4.5-5.8 l-20-5.2 -15-15 h-44 l-17 15 -11 3.4 a6 6 0 0 0-4.5 5.8 v7.8 a8 8 0 0 0 8 8z\" fill=\"rgba(255,255,255,.92)\"/> <path d=\"M103 123 h20 v13 h-33z M128 123 h17 l13 13 h-30z\" fill=\"#0B6E6A\" opacity=\".55\"/> <circle cx=\"102\" cy=\"158\" r=\"10\" fill=\"#063E44\" stroke=\"#fff\" stroke-width=\"3\"/><circle cx=\"162\" cy=\"158\" r=\"10\" fill=\"#063E44\" stroke=\"#fff\" stroke-width=\"3\"/> <path d=\"M262 148 Q258 115 268 84\" stroke=\"rgba(255,255,255,.92)\" stroke-width=\"5\" fill=\"none\" stroke-linecap=\"round\"/> <path d=\"M268 84 q-26-4-40 12 q22-6 40-12z M268 84 q24-8 40 6 q-22-4-40-6z M268 84 q-8-20-28-24 q20 6 28 24z M268 84 q10-22 30-22 q-20 6-30 22z\" fill=\"rgba(255,255,255,.92)\"/>"
  },
  "home-construction": {
    "from": "#4E3404",
    "to": "#B07A14",
    "svg": "<circle cx=\"70\" cy=\"52\" r=\"15\" fill=\"#F4B846\"/> <path d=\"M0 168 H320 V200 H0Z\" fill=\"#2E1E02\" opacity=\".35\"/> <path d=\"M104 120 L160 74 L216 120\" fill=\"none\" stroke=\"rgba(255,255,255,.92)\" stroke-width=\"6\" stroke-linejoin=\"round\" stroke-linecap=\"round\"/> <rect x=\"116\" y=\"116\" width=\"88\" height=\"52\" fill=\"rgba(255,255,255,.92)\" rx=\"2\"/> <rect x=\"152\" y=\"134\" width=\"18\" height=\"34\" fill=\"#8A5A00\" opacity=\".75\"/> <rect x=\"126\" y=\"128\" width=\"16\" height=\"16\" fill=\"#8A5A00\" opacity=\".45\"/><rect x=\"180\" y=\"128\" width=\"16\" height=\"16\" fill=\"#8A5A00\" opacity=\".45\"/> <g stroke=\"rgba(255,255,255,.92)\" stroke-width=\"4\" stroke-linecap=\"round\"><path d=\"M236 168 L252 80 M262 168 L274 80\"/><path d=\"M240 150 h24 M244 128 h24 M248 106 h24 M251 88 h22\" stroke-width=\"3\"/></g> <path d=\"M56 168 L80 128\" stroke=\"#F4B846\" stroke-width=\"5\" stroke-linecap=\"round\"/><path d=\"M70 120 L92 134\" stroke=\"#F4B846\" stroke-width=\"10\" stroke-linecap=\"round\"/><path d=\"M90 133 l6 -8\" stroke=\"#F4B846\" stroke-width=\"5\" stroke-linecap=\"round\"/>"
  },
  "professional-services": {
    "from": "#082F38",
    "to": "#1B6772",
    "svg": "<g fill=\"rgba(255,255,255,.16)\"><rect x=\"28\" y=\"70\" width=\"14\" height=\"96\"/><rect x=\"52\" y=\"70\" width=\"14\" height=\"96\"/><rect x=\"76\" y=\"70\" width=\"14\" height=\"96\"/><path d=\"M20 70 L59 48 L98 70Z\"/><rect x=\"20\" y=\"166\" width=\"78\" height=\"8\"/></g> <rect x=\"150\" y=\"62\" width=\"64\" height=\"84\" rx=\"4\" fill=\"rgba(255,255,255,.35)\" transform=\"rotate(-8 182 104)\"/> <g stroke=\"#fff\" stroke-width=\"3\" opacity=\".6\" stroke-linecap=\"round\" transform=\"rotate(-8 182 104)\"><path d=\"M160 78 h40 M160 90 h44 M160 102 h34\"/></g> <rect x=\"132\" y=\"104\" width=\"100\" height=\"66\" rx=\"10\" fill=\"rgba(255,255,255,.92)\"/> <path d=\"M164 104 v-10 a6 6 0 0 1 6-6 h24 a6 6 0 0 1 6 6 v10\" fill=\"none\" stroke=\"rgba(255,255,255,.92)\" stroke-width=\"6\"/> <path d=\"M132 128 h100\" stroke=\"#1B6772\" stroke-width=\"4\" opacity=\".5\"/><rect x=\"176\" y=\"122\" width=\"12\" height=\"12\" rx=\"2\" fill=\"#F4B846\"/> <path d=\"M246 160 l40-40\" stroke=\"#F4B846\" stroke-width=\"6\" stroke-linecap=\"round\"/>"
  },
  "tourism-hospitality": {
    "from": "#06514A",
    "to": "#13A08A",
    "svg": "<circle cx=\"200\" cy=\"112\" r=\"26\" fill=\"#F4B846\"/> <rect x=\"0\" y=\"112\" width=\"320\" height=\"50\" fill=\"#0A7F78\"/> <g stroke=\"#fff\" stroke-width=\"2.5\" opacity=\".45\" stroke-linecap=\"round\"><path d=\"M182 124 h36 M188 134 h24 M40 128 h30 M250 140 h34 M90 146 h22\"/></g> <path d=\"M0 160 Q120 146 320 162 V200 H0Z\" fill=\"#F6DFA8\"/> <path d=\"M92 192 L112 120\" stroke=\"#063E44\" stroke-width=\"4\" stroke-linecap=\"round\"/> <path d=\"M72 128 Q112 92 152 128Z\" fill=\"rgba(255,255,255,.92)\"/><path d=\"M98 116 Q112 98 126 116\" fill=\"none\" stroke=\"#F4B846\" stroke-width=\"10\" opacity=\".9\"/> <path d=\"M276 186 Q270 140 284 104\" stroke=\"#063E44\" stroke-width=\"5\" fill=\"none\" stroke-linecap=\"round\"/> <path d=\"M284 104 q-26-4-40 12 q22-6 40-12z M284 104 q22-10 38 4 q-22-4-38-4z M284 104 q-8-20-28-24 q20 6 28 24z\" fill=\"#063E44\"/>"
  },
  "retail-everyday": {
    "from": "#5F1F14",
    "to": "#C2523A",
    "svg": "<rect x=\"84\" y=\"78\" width=\"152\" height=\"94\" rx=\"4\" fill=\"rgba(255,255,255,.92)\"/> <g><path d=\"M78 76 h164 v18 H78z\" fill=\"#F4B846\"/> <path d=\"M78 94 q10.25 12 20.5 0 q10.25 12 20.5 0 q10.25 12 20.5 0 q10.25 12 20.5 0 q10.25 12 20.5 0 q10.25 12 20.5 0 q10.25 12 20.5 0 q10.25 12 20.5 0z\" fill=\"#F4B846\"/> <path d=\"M98.5 76 h20.5 v18 h-20.5z M139.5 76 h20.5 v18 h-20.5z M180.5 76 h20.5 v18 h-20.5z M221.5 76 h20.5 v18 h-20.5z\" fill=\"#fff\" opacity=\".85\"/></g> <rect x=\"104\" y=\"118\" width=\"58\" height=\"40\" rx=\"3\" fill=\"#C2523A\" opacity=\".25\"/> <g fill=\"#C2523A\" opacity=\".75\"><rect x=\"112\" y=\"136\" width=\"10\" height=\"16\" rx=\"2\"/><rect x=\"127\" y=\"130\" width=\"10\" height=\"22\" rx=\"2\"/><circle cx=\"148\" cy=\"145\" r=\"7\"/></g> <rect x=\"180\" y=\"118\" width=\"38\" height=\"54\" rx=\"3\" fill=\"#063E44\" opacity=\".8\"/><circle cx=\"210\" cy=\"146\" r=\"2.5\" fill=\"#F4B846\"/> <path d=\"M0 172 H320 V200 H0Z\" fill=\"#3E140C\" opacity=\".35\"/>"
  },
  "health": {
    "from": "#0A5550",
    "to": "#2BA493",
    "svg": "<path d=\"M0 132 h96 l12-26 14 52 14-40 10 14 h174\" fill=\"none\" stroke=\"#fff\" stroke-width=\"3\" opacity=\".35\" stroke-linejoin=\"round\"/> <path d=\"M160 168 C110 136 112 92 140 86 C152 84 160 94 160 100 C160 94 168 84 180 86 C208 92 210 136 160 168Z\" fill=\"rgba(255,255,255,.92)\"/> <path d=\"M160 106 v40 M140 126 h40\" stroke=\"#0E8578\" stroke-width=\"10\" stroke-linecap=\"round\"/> <path d=\"M238 160 q-6-34 28-48 q-2 34-28 48z M78 72 q24-14 40 6 q-24 10-40-6z\" fill=\"#F4B846\" opacity=\".9\"/>"
  },
  "education-childcare": {
    "from": "#0C2F4D",
    "to": "#1F6E96",
    "svg": "<circle cx=\"160\" cy=\"120\" r=\"46\" fill=\"#F4B846\" opacity=\".9\"/> <path d=\"M160 104 C140 92 112 92 92 98 V164 C112 158 140 158 160 170 C180 158 208 158 228 164 V98 C208 92 180 92 160 104Z\" fill=\"rgba(255,255,255,.92)\"/> <path d=\"M160 104 V170\" stroke=\"#1F6E96\" stroke-width=\"3\" opacity=\".6\"/> <g stroke=\"#1F6E96\" stroke-width=\"3\" opacity=\".35\" stroke-linecap=\"round\"><path d=\"M104 114 c14-3 30-3 44 4 M104 128 c14-3 30-3 44 4 M104 142 c14-3 30-3 44 4 M172 118 c14-7 30-7 44-4 M172 132 c14-7 30-7 44-4 M172 146 c14-7 30-7 44-4\"/></g> <path d=\"M160 44 L200 60 L160 76 L120 60Z\" fill=\"#fff\"/><path d=\"M140 68 v12 c12 8 28 8 40 0 v-12\" fill=\"#fff\" opacity=\".85\"/><path d=\"M200 60 v20\" stroke=\"#F4B846\" stroke-width=\"3\"/> <path d=\"M0 176 H320 V200 H0Z\" fill=\"#071F33\" opacity=\".4\"/>"
  },
  "events-venues": {
    "from": "#4A1730",
    "to": "#A63A5A",
    "svg": "<path d=\"M0 34 Q80 70 160 40 T320 36\" fill=\"none\" stroke=\"#fff\" stroke-width=\"2\" opacity=\".6\"/> <g fill=\"#F4B846\"><circle cx=\"30\" cy=\"47\" r=\"5\"/><circle cx=\"70\" cy=\"56\" r=\"5\"/><circle cx=\"110\" cy=\"54\" r=\"5\"/><circle cx=\"150\" cy=\"44\" r=\"5\"/><circle cx=\"190\" cy=\"38\" r=\"5\"/><circle cx=\"230\" cy=\"40\" r=\"5\"/><circle cx=\"270\" cy=\"42\" r=\"5\"/><circle cx=\"305\" cy=\"37\" r=\"5\"/></g> <path d=\"M90 172 V118 L160 82 L230 118 V172Z\" fill=\"rgba(255,255,255,.92)\"/> <path d=\"M160 82 V172\" stroke=\"#A63A5A\" stroke-width=\"3\" opacity=\".35\"/> <path d=\"M90 118 q17.5 14 35 0 q17.5 14 35 0 q17.5 14 35 0 q17.5 14 35 0\" fill=\"none\" stroke=\"#A63A5A\" stroke-width=\"3\" opacity=\".5\"/> <path d=\"M140 172 v-30 a20 20 0 0 1 40 0 v30\" fill=\"#4A1730\" opacity=\".75\"/> <g fill=\"#fff\" opacity=\".8\"><circle cx=\"256\" cy=\"140\" r=\"6\"/><path d=\"M261 140 V112 l14 -4 v8 l-14 4\" stroke=\"#fff\" stroke-width=\"3\" fill=\"none\"/><circle cx=\"58\" cy=\"128\" r=\"5\"/><path d=\"M62 128 V106\" stroke=\"#fff\" stroke-width=\"3\"/></g> <path d=\"M0 172 H320 V200 H0Z\" fill=\"#2C0C1C\" opacity=\".4\"/>"
  }
};
