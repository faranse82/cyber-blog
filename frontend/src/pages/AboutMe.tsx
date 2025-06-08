const AboutMe: React.FC = () => {
    return (
        <div className="min-h-screen bg-dark-bg">
            <div className="max-w-4xl mx-auto py-20 px-6">
                <div className="bg-dark-card rounded-xl shadow-xl p-8">
                    <div className="space-y-8">

                        <div className="text-left">
                            <h1 className="text-4xl font-bold font-ubuntu text-white mb-4">About Me</h1>
                            <div className="w-fill h-1 bg-red-700 mx-auto"></div>
                        </div>
                        <div className="space-y-6 text-gray-300">
                            <p className="text-lg leading-relaxed">
                                Hi! I'm <span className="text-white font-semibold">Faran Sepehrisadr</span>,
                                a passionate cybersecurity specialist and full-stack developer based in Sydney, Australia.
                                I recently completed my Bachelor of Cyber Security at Macquarie University and am
                                currently working as a Software Development Volunteer and former Penetration Testing
                                Intern at SETUP Group.
                            </p>

                            <p className="leading-relaxed">
                                My expertise spans across cybersecurity, web development, and secure application design.
                                I have hands-on experience in penetration testing, vulnerability assessment, and building
                                secure applications using modern technologies like React.js, Rust, and Flutter.
                            </p>
                        </div>

                        {/* Skills Section */}
                        <div className="grid md:grid-cols-2 gap-8">
                            {/* Technical Skills */}
                            <div>
                                <h3 className="text-2xl font-bold text-white mb-4">Technical Skills</h3>
                                <div className="space-y-3">
                                    <div>
                                        <h4 className="text-red-400 font-semibold mb-2">Security & Testing</h4>
                                        <p className="text-gray-300 text-sm">
                                            Penetration Testing, Vulnerability Assessment, Burp Suite, XSStrike,
                                            SQLMap, Nmap, OWASP Top 10
                                        </p>
                                    </div>
                                    <div>
                                        <h4 className="text-red-400 font-semibold mb-2">Development</h4>
                                        <p className="text-gray-300 text-sm">
                                            React.js, TypeScript, Rust, Flutter, RESTful APIs,
                                            HTML5, CSS3, Git/GitHub
                                        </p>
                                    </div>
                                    <div>
                                        <h4 className="text-red-400 font-semibold mb-2">Systems</h4>
                                        <p className="text-gray-300 text-sm">
                                            Linux Administration, Windows, Network Security,
                                            System Hardening, VPN Configuration
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Experience Highlights */}
                            <div>
                                <h3 className="text-2xl font-bold text-white mb-4">Experience</h3>
                                <div className="space-y-4">
                                    <div>
                                        <h4 className="text-white font-semibold">Software Development Volunteer</h4>
                                        <p className="text-red-400 text-sm">SETUP Group • July 2024 - Feb 2025</p>
                                        <p className="text-gray-300 text-sm mt-1">
                                            Building secure web applications with React.js and Rust,
                                            implementing security controls aligned with ISO 27001.
                                        </p>
                                    </div>
                                    <div>
                                        <h4 className="text-white font-semibold">Penetration Testing Intern</h4>
                                        <p className="text-red-400 text-sm">SETUP Group • Feb 2024 - July 2024</p>
                                        <p className="text-gray-300 text-sm mt-1">
                                            Conducted comprehensive security assessments following OWASP methodology,
                                            created detailed remediation recommendations.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Education & Interests */}
                        <div className="grid md:grid-cols-2 gap-8">
                            <div>
                                <h3 className="text-2xl font-bold text-white mb-4">Education</h3>
                                <div>
                                    <h4 className="text-white font-semibold">Bachelor of Cyber Security</h4>
                                    <p className="text-red-400 text-sm">Macquarie University • Completed June 2025</p>
                                    <p className="text-gray-300 text-sm mt-1">
                                        Specialized in Web Security Technologies,
                                        Secure Applications Development, and Offensive Security.
                                    </p>
                                </div>
                            </div>

                            <div>
                                <h3 className="text-2xl font-bold text-white mb-4">Interests</h3>
                                <div className="space-y-2 text-gray-300">
                                    <p className="text-sm">🔐 Cybersecurity Research & Vulnerability Discovery</p>
                                    <p className="text-sm">💻 Open Source Development & Secure Coding</p>
                                    <p className="text-sm">🏗️ Building Secure Network Infrastructure</p>
                                    <p className="text-sm">📱 Mobile Application Security</p>
                                </div>
                            </div>
                        </div>

                        {/* Contact/Links */}
                        <div className="text-center pt-8 border-t border-gray-600">
                            <p className="text-gray-300 mb-4">
                                Feel free to connect with me or check out my work!
                            </p>
                            <div className="flex justify-center gap-6">
                                <a
                                    href="https://github.com/faranse82"
                                    className="text-red-400 hover:text-red-300 font-medium"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                >
                                    GitHub
                                </a>
                                <a
                                    href="https://www.linkedin.com/in/faran-sepehri-b82716278/"
                                    className="text-red-400 hover:text-red-300 font-medium"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                >
                                    LinkedIn
                                </a>
                                <a
                                    href="mailto:faransepehri1382@gmail.com"
                                    className="text-red-400 hover:text-red-300 font-medium"
                                >
                                    Email
                                </a>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AboutMe;