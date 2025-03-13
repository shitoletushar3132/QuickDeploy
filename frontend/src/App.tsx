import React, { useState } from "react";
import {
  Copy,
  Github,
  Loader2,
  ExternalLink,
  Rocket,
  Zap,
  Shield,
  Globe,
} from "lucide-react";
import { BASE, BASE_URL } from "./constant";

function App() {
  const [githubUrl, setGithubUrl] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [deploymentUrl, setDeploymentUrl] = useState("");
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");

  const features = [
    {
      icon: <Rocket className="w-6 h-6 text-blue-400" />,
      title: "Instant Deployment",
      description:
        "Deploy your frontend projects in seconds with just a GitHub URL. Support for React, Vue, and static sites.",
    },
    {
      icon: <Zap className="w-6 h-6 text-yellow-400" />,
      title: "Lightning Fast",
      description:
        "Optimized build process and global CDN ensure your site loads quickly for users worldwide.",
    },
    {
      icon: <Shield className="w-6 h-6 text-green-400" />,
      title: "Secure & Reliable",
      description:
        "Enterprise-grade security with SSL certificates and continuous monitoring of your deployments.",
    },
    {
      icon: <Globe className="w-6 h-6 text-purple-400" />,
      title: "Global Edge Network",
      description:
        "Your site is served from multiple locations worldwide for the best possible performance.",
    },
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");
    setStatus("");

    try {
      const response = await fetch(`${BASE_URL}/deploy`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ repoUrl: githubUrl }),
      });

      if (!response.ok) {
        throw new Error("Deployment failed");
      }

      const data = await response.json();
      setDeploymentUrl(data.id);

      // Poll deployment status only if deployment is successful
      if (data.id) {
        const interval = setInterval(async () => {
          try {
            const statusResponse = await fetch(`${BASE_URL}/status/${data.id}`);
            const statusData = await statusResponse.json();
            setStatus(statusData.status);

            console.log(statusData);

            if (
              statusData.status === "deployed" ||
              statusData.status === "failed"
            ) {
              clearInterval(interval);
              setIsLoading(false);
            }
          } catch (error) {
            console.error("Error fetching status:", error);
            clearInterval(interval);
          }
        }, 1000);
      }
    } catch (err) {
      setError("Failed to deploy. Please try again.");
    }
  };

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(`http://${deploymentUrl}.${BASE}`);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 text-white">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-blue-500/10 backdrop-blur-3xl"></div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-24">
          <div className="text-center">
            <h1 className="text-5xl font-bold mb-6 bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-400">
              Deploy Your Frontend in Seconds
            </h1>
            <p className="text-xl text-gray-300 mb-12 max-w-2xl mx-auto">
              Streamline your deployment process with our powerful platform.
              From React applications to static sites, we've got you covered.
            </p>
          </div>

          {/* Deployment Form */}
          <div className="max-w-2xl mx-auto">
            <div className="bg-gray-800/50 rounded-xl p-8 backdrop-blur-sm border border-gray-700 shadow-xl">
              <div className="flex items-center gap-3 mb-6">
                <Github className="w-8 h-8" />
                <h2 className="text-2xl font-semibold">
                  Deploy Your Repository
                </h2>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label
                    htmlFor="github-url"
                    className="block text-sm font-medium mb-2"
                  >
                    GitHub Repository URL
                  </label>
                  <input
                    id="github-url"
                    type="url"
                    value={githubUrl}
                    onChange={(e) => setGithubUrl(e.target.value)}
                    placeholder="https://github.com/username/repository"
                    className="w-full px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
                    required
                  />
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      {status}
                    </>
                  ) : (
                    "Deploy Repository"
                  )}
                </button>
              </form>

              {error && (
                <div className="mt-4 p-4 bg-red-500/20 border border-red-500/50 rounded-lg text-red-200">
                  {error}
                </div>
              )}

              {status == "deployed" && !error && (
                <div className="mt-6 p-6 bg-green-500/10 border border-green-500/30 rounded-lg">
                  <h3 className="text-lg font-medium text-green-400 mb-2">
                    🎉 Deployment Successful!
                  </h3>
                  <div className="flex items-center gap-2 bg-gray-900 p-3 rounded-lg">
                    <input
                      type="text"
                      value={`${deploymentUrl}.${BASE}`}
                      readOnly
                      className="bg-transparent flex-1 outline-none"
                    />
                    <button
                      onClick={copyToClipboard}
                      className="p-2 hover:bg-gray-800 rounded-md transition"
                      title="Copy to clipboard"
                    >
                      <Copy className="w-5 h-5" />
                    </button>
                    <a
                      href={`http://${deploymentUrl}.${BASE}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2 hover:bg-gray-800 rounded-md transition"
                      title="Open deployment"
                    >
                      <ExternalLink className="w-5 h-5" />
                    </a>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
        <h2 className="text-3xl font-bold text-center mb-16">
          Why Choose Our Platform?
        </h2>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          {features.map((feature, index) => (
            <div
              key={index}
              className="bg-gray-800/30 rounded-xl p-6 border border-gray-700/50 hover:border-gray-600 transition"
            >
              <div className="mb-4">{feature.icon}</div>
              <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
              <p className="text-gray-400">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="text-center text-gray-400">
            <p>© 2025 Deployment Service. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App;
