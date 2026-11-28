import type { ArtPreset, FolderFile } from "@/components/ui/glass-folder-cards";

export type ProjectFeature = {
  title: string;
  description?: string;
};

export type ProjectImage = {
  src: string;
  alt: string;
  caption?: string;
};

export type ProjectData = {
  /** Unique identifier */
  id: string;
  /** URL-friendly identifier used in /project/[slug] */
  slug: string;
  /** Project display title */
  name: string;
  /** Comprehensive project overview & problem-solution context */
  description: string;
  /** Optional thumbnail path displayed in Finder Explorer and Glass Folder */
  thumbnail?: string;
  /** Fallback procedural artwork preset when thumbnail is omitted */
  art?: ArtPreset;
  /** Screenshots or visual showcase items */
  images?: Array<string | ProjectImage>;
  /** Tech stack badges */
  technologies?: string[];
  /** Core capabilities (string or structured title + description) */
  features?: Array<string | ProjectFeature>;
  /** Live deployment URL if available */
  liveDemo?: string;
  /** Source code repository URL if available */
  github?: string;
  /** Domain or discipline classification */
  category?: string;
  /** Completion year or timeline period */
  date?: string;
  /** Target folder category in Finder Explorer (defaults to "case-studies") */
  folderId?: "profile" | "case-studies" | "archive";
};

export const PROJECTS_DATA: ProjectData[] = [
  {
    id: "seismotrack-web",
    slug: "seismotrack-web",
    name: "SeismoTrack Website",
    description:
      "SeismoTrack is a real-time GIS web application built with React and Vite that integrates Mapbox to provide accurate spatial visualization, distance calculations, and critical disaster monitoring data.",
    thumbnail: "/project-images/seismotrack-web/seismo-web-1.png",
    art: "ember",
    category: "Web Application",
    date: "2025",
    folderId: "case-studies",
    liveDemo: "https://seismo-track.vercel.app/",
    github: "https://github.com/hiraeth12/SeismoTrack",
    images: [
      {
        src: "/project-images/seismotrack-web/seismo-web-1.png",
        alt: "SeismoTrack interactive tectonic fault line map and real-time magnitude telemetry landing page",
        caption: "Interactive Landing Page",
      },
      {
        src: "/project-images/seismotrack-web/seismo-web-2.png",
        alt: "Seismotrack real-time earthquake monitoring dashboard with epicenter markers and magnitude indicators",
        caption: "Informative Dashboard with Epicenter Markers",
      },
      {
        src: "/project-images/seismotrack-web/seismo-web-3.png",
        alt: "Earthquake simulation and visualization with magnitude, depth, and epicenter location information",
        caption: "Earthquake Warning Simulation & Visualization",
      },
      {
        src: "/project-images/seismotrack-web/seismo-web-4.png",
        alt: "Tsunami simulation and visualization with wave propagation and potential coastal inundation",
        caption: "Tsunami Warning Simulation & Visualization",
      },
    ],
    technologies: ["React", "TypeScript", "Vite.js", "Tailwind CSS", "Mapbox"],
    features: [
      {
        title: "Real-Time Earthquake Monitoring Dashboard",
        description:
          "Displays real-time seismic activity across Indonesia through an interactive map, featuring earthquake epicenters, tectonic plate boundaries, magnitude indicators, depth information, and chronological event logs.",
      },
      {
        title: "Earthquake Simulation & Visualization",
        description:
          "Simulates earthquake events through interactive seismic visualizations, presenting earthquake magnitude, hypocenter depth, epicenter location, and estimated impact information.",
      },
      {
        title: "Tsunami Simulation & Visualization",
        description:
          "Provides interactive tsunami simulations to visualize wave propagation, potential coastal inundation, and hazard scenarios for disaster preparedness and risk awareness.",
      },
      {
        title: "Post-Event Earthquake & Tsunami Warning Updates",
        description:
          "Presents post-earthquake information and tsunami warning updates, including seismic parameters, affected regions, tsunami threat levels, and warning status changes based on BMKG information.",
      },
    ],
  },
  {
    id: "tani-maju",
    slug: "tani-maju",
    name: "Tani Maju",
    description:
      "TaniMaju is a web platform built with React and Vite that empowers the Sukamaju community in Bandung to efficiently manage, transparently report, and showcase their agricultural harvests to prospective buyers.",
    thumbnail: "/project-images/tani-maju/tani-maju-1.png",
    art: "ember",
    category: "Web Application",
    date: "2025",
    folderId: "case-studies",
    liveDemo: "#",
    github: "https://github.com/hiraeth12/website-tanimaju",
    images: [
      {
        src: "/project-images/tani-maju/tani-maju-1.png",
        alt: "Tani Maju interactive agricultural Landing page",
        caption: "Tani Maju's Informative Landing Page",
      },
      {
        src: "/project-images/tani-maju/tani-maju-2.png",
        alt: "Tani Maju marketplace page with product listings, pricing, and availability information",
        caption: "Marketplace Product Listings with Pricing & Availability",
      },
      {
        src: "/project-images/tani-maju/tani-maju-3.png",
        alt: "Blog Page with articles, news, and updates related to agriculture and community initiatives",
        caption: "Blog Page with Agricultural and Community Updates",
      },
      {
        src: "/project-images/tani-maju/tani-maju-4.png",
        alt: "Dashboard page with user profile, harvest management, and reporting features for Sukamaju community",
        caption: "Dashboard with User Profile and Harvest Management",
      },
    ],
    technologies: [
      "React",
      "TypeScript",
      "Vite.js",
      "Tailwind CSS",
      "MySQL",
      "Node.js",
      "CPanel Hosting",
    ],
    features: [
      {
        title: "Harvest Management",
        description: "Add, edit, and delete records of village harvests.",
      },
      {
        title: "Product Showcase & Marketplace",
        description:
          "Showcases available products and allows users to browse and purchase items from the Sukamaju community.",
      },
      {
        title: "Reporting & Analytics",
        description: "Generate reports on harvest quantities and sales.",
      },
      {
        title: "User Roles",
        description:
          "Support for admin and regular users with tailored permissions.",
      },
    ],
  },
  {
    id: "seismotrack-mobile",
    slug: "seismotrack-mobile",
    name: "SeismoTrack Mobile App",
    description:
      "SeismoTrack Mobile is a location-aware mobile application built with React Native and Firebase to provide earthquake and tsunami information across Indonesia using official BMKG data. The application combines GIS-based mapping, location-aware notifications, and cloud-based data processing to improve the relevance of disaster alerts.",
    thumbnail: "/project-images/seismotrack-mobile/seismotrack-mobile-1.png",
    art: "ember",
    category: "Mobile Application",
    date: "2025 - 2026",
    folderId: "case-studies",
    liveDemo: "#",
    github: "https://github.com/hiraeth12/ta-skripsi",
    images: [
      {
        src: "/project-images/seismotrack-mobile/seismotrack-mobile-1.png",
        alt: "Interactive Landing page with hazard information and Detailed Information",
        caption: "SeismoTrack Mobile Landing Page with Hazard Information",
      },
      {
        src: "/project-images/seismotrack-mobile/seismotrack-mobile-2.png",
        alt: "Alarm Warning when earthquake is detected nearby with magnitude, depth, and epicenter location information",
        caption:
          "Alarm Warning for Nearby Earthquake Detection with Magnitude & Epicenter Info",
      },
      {
        src: "/project-images/seismotrack-mobile/seismotrack-mobile-3.png",
        alt: "Detailed Tsunami Map with wave propagation and potential coastal inundation",
        caption: "Detailed Tsunami Map",
      },
      {
        src: "/project-images/seismotrack-mobile/seismotrack-mobile-4.png",
        alt: "Detailed Information",
        caption: "Detailed Information on Earthquake and Tsunami Parameters",
      },
    ],
    technologies: [
      "React Native",
      "TypeScript",
      "Expo",
      "Tailwind CSS",
      "Mapbox",
      "Firebase",
      "Google Cloud Platform",
    ],
    features: [
      {
        title: "Real-Time BMKG Earthquake Monitoring",
        description:
          "Integrates live earthquake data from BMKG through automated data retrieval and JSON/XML feed processing to deliver up-to-date seismic event information.",
      },
      {
        title: "Interactive Geospatial Earthquake Mapping",
        description:
          "Visualizes earthquake epicenters and seismic event locations on an interactive map, enabling users to explore geographic distribution and monitor seismic activity.",
      },
      {
        title: "Location-Based Earthquake Notifications",
        description:
          "Implements Haversine-based distance calculations to detect earthquakes within user-defined proximity and deliver location-aware alerts based on earthquake intensity.",
      },
      {
        title: "Cloud-Powered Seismic Data Management",
        description:
          "Leverages Google Cloud Platform and Firebase Realtime Database to process earthquake data, synchronize seismic event records, and maintain accessible monitoring history.",
      },
    ],
  },
  {
    id: "handwritten-digit-recognition",
    slug: "handwritten-digit-recognition",
    name: "Handwritten Digit Recognition",
    description:
      "This project is a neural network-based solution for recognizing handwritten digits using the MNIST dataset. The implementation leverages TensorFlow and Keras for building and training the model.",
    thumbnail:
      "/project-images/handwritten-digit-recognition/handwrotten-digit-recognition-1.png",
    category: "Machine Learning",
    date: "2025",
    folderId: "case-studies",
    liveDemo: "#",
    github: "https://github.com/hiraeth12/handwrittenRecognition",
    images: [
      {
        src: "/project-images/handwritten-digit-recognition/handwrotten-digit-recognition-1.png",
        alt: "MNIST Dataset Handwritten Digit Recognition",
        caption: "MNIST Dataset Handwritten Digit Recognition",
      },
    ],
    technologies: ["Python", "TensorFlow", "Keras", "NumPy"],
    features: [
      {
        title: "Data Preprocessing",
        description:
          "Normalization and reshaping of images for model compatibility.",
      },
      {
        title: "Model Architecture",
        description:
          "A sequential model with convolutional, pooling, and dense layers.",
      },
      {
        title: "Training and Evaluation",
        description:
          "Trains the model on the MNIST dataset and evaluates its performance.",
      },
      {
        title: "Visualization",
        description:
          "Visualizes the results of the handwritten digit recognition model using Matplotlib.",
      },
    ],
  },
  {
    id: "cat-breed-image-classification",
    slug: "cat-breed-image-classification",
    name: "Cat Breed Image Classification",
    description:
      "A deep learning project that classifies cat images into six different breeds using Convolutional Neural Networks (CNNs). The implementation explores and compares MobileNet and MobileNetV2 architectures using TensorFlow and Keras, with model evaluation and TensorFlow Lite export for lightweight inference.",
    thumbnail: "/project-images/cat-breed-image-classification/cats.jpg",
    category: "Machine Learning",
    date: "2025",
    folderId: "case-studies",
    liveDemo: "#",
    github: "https://github.com/hiraeth12/cat-img-classif",
    images: [
      {
        src: "/project-images/cat-breed-image-classification/cats.jpg",
        alt: "Cat Breed Image Classification Dashboard",
        caption: "Cat Breed Image Classification Results",
      },
    ],
    technologies: [
      "Python",
      "TensorFlow",
      "Keras",
      "MobileNet",
      "MobileNetV2",
      "Scikit-learn",
      "NumPy",
      "Pandas",
      "Matplotlib",
      "Seaborn",
    ],
    features: [
      {
        title: "Multi-Class Cat Breed Classification",
        description:
          "Classifies cat images into six distinct breeds: Bengal, Caracal, Maine Coon, Scottish Fold, Siamese, and Sphynx using deep learning models.",
      },
      {
        title: "Dataset Preprocessing & Exploratory Analysis",
        description:
          "Performs dataset preparation, class distribution analysis, and train-validation-test splitting with a 70:20:10 ratio to support model development and evaluation.",
      },
      {
        title: "MobileNet & MobileNetV2 Architecture Comparison",
        description:
          "Implements and evaluates two lightweight CNN architectures, MobileNet and MobileNetV2, to explore their classification performance on the cat breeds dataset.",
      },
      {
        title: "Model Evaluation & TensorFlow Lite Export",
        description:
          "Evaluates classification performance using accuracy, precision, recall, F1-score, and confusion matrices, with trained models exported in TensorFlow Lite format for lightweight inference.",
      },
    ],
  },

  {
    id: "goemotions-bert-multi-label",
    slug: "goemotions-bert-multi-label",
    name: "GoEmotions Multi-Label Classification with BERT",
    description:
      "Implementation of a deep learning model for multi-label emotion classification using the GoEmotions dataset, which covers 28 emotion categories[cite: 2]. This project fine-tunes the pre-trained bert-base-uncased model to detect multiple emotion probabilities simultaneously in a single text using the multi-hot encoding method[cite: 2].",
    thumbnail: "/project-images/hugging-face/goemotions.jpg",
    category: "Natural Language Processing",
    date: "2026",
    folderId: "case-studies",
    liveDemo: "#",
    github: "https://github.com/hiraeth12/finetuning-bert-goemotions",
    images: [
      {
        src: "/project-images/hugging-face/goemotions.jpg",
        alt: "GoEmotions Multi-Label Classification Dashboard",
        caption: "Emotion Classification Prediction Results",
      },
    ],
    technologies: [
      "Python",
      "PyTorch",
      "HuggingFace Transformers",
      "BERT",
      "Scikit-learn",
      "NumPy",
    ],
    features: [
      {
        title: "Multi-Label Emotion Classification (28 Categories)",
        description:
          "Capable of simultaneously predicting and classifying input text into 28 different emotion classes, such as admiration, amusement, anger, approval, and annoyance[cite: 2].",
      },
      {
        title: "Preprocessing with Multi-Hot Encoding",
        description:
          "Processes the dataset through text tokenization and converts label arrays into a multi-hot encoding representation with a float32 data type to ensure compatibility with model computation[cite: 2].",
      },
      {
        title: "BERT Fine-Tuning and Training Optimization",
        description:
          "Trains the bert-base-uncased model architecture for 5 epochs utilizing NVIDIA L4 GPU acceleration with mixed precision (FP16), 0.01 weight decay, and a cosine learning rate scheduler[cite: 2].",
      },
      {
        title: "Evaluation Metrics and Custom Inference Pipeline",
        description:
          "Evaluates model accuracy using Macro F1 and Exact Match scores, and includes a predictive inference pipeline utilizing a sigmoid activation function with a class determination threshold of 0.3[cite: 2].",
      },
    ],
  },

  {
    id: "finetuning-phi2-text-summarization",
    slug: "finetuning-phi2-text-summarization",
    name: "Fine-tuning Phi-2 for Abstractive Text Summarization",
    description:
      "This project implements instruction-tuned fine-tuning on the Microsoft Phi-2 language model for abstractive text summarization tasks using the XSum dataset[cite: 4]. The project utilizes the QLoRA method for memory efficiency and trains the 2.7 billion parameter model on consumer GPUs[cite: 4].",
    thumbnail: "/project-images/hugging-face/phi-2.png",
    category: "Natural Language Processing",
    date: "2026",
    folderId: "case-studies",
    liveDemo: "#",
    github: "https://github.com/hiraeth12/finetuning-phi-2-text-summarization-",
    images: [
      {
        src: "/project-images/hugging-face/phi-2.png",
        alt: "Phi-2 Text Summarization Dashboard",
        caption: "Text Summarization Generation Results",
      },
    ],
    technologies: [
      "Python",
      "PyTorch",
      "HuggingFace Transformers",
      "QLoRA",
      "PEFT",
    ],
    features: [
      {
        title: "Intelligent Abstractive Text Summarization",
        description:
          "Generates concise, single-sentence news summaries by understanding semantic context and paraphrasing source texts using the XSum (Extreme Summarization) dataset[cite: 4].",
      },
      {
        title: "Memory-Efficient Fine-Tuning (QLoRA)",
        description:
          "Utilizes Quantized Low-Rank Adaptation (QLoRA) with 4-bit NF4 quantization, reducing memory usage by approximately 75% and training only about 0.5% of the model's parameters[cite: 4].",
      },
      {
        title: "Instruction-Based Training Optimization",
        description:
          "Implements a custom prompt format and a 'Label Masking' strategy where the loss function is computed only on the target summary tokens, preventing the model from merely memorizing initial instructions[cite: 4].",
      },
      {
        title: "Comprehensive Model Evaluation (ROUGE)",
        description:
          "Evaluates the quality of generated summaries using standard ROUGE metrics (ROUGE-1, ROUGE-2, ROUGE-L, and ROUGE-Lsum) to measure n-gram overlap with the original references[cite: 4].",
      },
    ],
  },
  {
    id: "finetuning-t5-question-answering",
    slug: "finetuning-t5-question-answering",
    name: "Fine-tuning T5-base for Generative Question Answering",
    description:
      "A deep learning project implementing a generative question answering system by fine-tuning Google's T5-base model on the Stanford Question Answering Dataset (SQuAD)[cite: 5]. The project showcases a sequence-to-sequence approach for answer generation rather than extractive span selection[cite: 5].",
    thumbnail: "/project-images/hugging-face/phi-2.png",
    category: "Natural Language Processing",
    date: "2026",
    folderId: "case-studies",
    liveDemo: "#",
    github: "https://github.com/hiraeth12/finetuning-t5-question-answering",
    images: [
      {
        src: "/project-images/hugging-face/phi-2.png",
        alt: "T5 Generative QA Dashboard",
        caption: "Generative Question Answering Results",
      },
    ],
    technologies: [
      "Python",
      "PyTorch",
      "HuggingFace Transformers",
      "NumPy",
      "Pandas",
    ],
    features: [
      {
        title: "Generative Sequence-to-Sequence QA",
        description:
          "Implements a generative question answering approach using the T5-base encoder-decoder transformer model, providing more flexibility in formulating answers compared to extractive methods[cite: 5].",
      },
      {
        title: "T5-Specific Input Formatting",
        description:
          "Processes the SQuAD dataset inputs by formatting them with explicit task prefixes ('question: {question} context: {context}') to properly prompt the Text-To-Text Transfer Transformer[cite: 5].",
      },
      {
        title: "Optimized Training Strategy",
        description:
          "Fine-tunes the 220M parameter model for 3 epochs using the AdamW optimizer, mixed precision (FP16), and a beam search generation strategy (num_beams=4) for optimal text output[cite: 5].",
      },
      {
        title: "Comprehensive Evaluation Metrics",
        description:
          "Evaluates the generative model's performance on the validation set using standard question answering metrics, specifically Exact Match (EM) and F1 Score[cite: 5].",
      },
    ],
  },
];

export function getProjectBySlug(
  slug?: string | null,
): ProjectData | undefined {
  if (!slug) return undefined;
  const normalized = slug.trim().toLowerCase();
  return PROJECTS_DATA.find(
    (project) => project.slug.toLowerCase() === normalized,
  );
}

export function projectToFolderFile(project: ProjectData): FolderFile {
  return {
    name: project.name,
    meta: project.category ?? "Project Showcase",
    art: project.art ?? "ember",
    image: project.thumbnail,
    href: `/project/${project.slug}`,
    kind: "project",
    projectSlug: project.slug,
  };
}
