import { Header } from './components'
import { About, BeyondTheCode, Contact, Education, EngineeringLab, Experience, Hero, SelectedWork, WhatIBuild } from './sections'
import './styles.css'

function App() {
  return <div className="site">
    <Header />
    <main id="main-content">
      <Hero />
      <WhatIBuild />
      <SelectedWork />
      <Experience />
      <EngineeringLab />
      <About />
      <BeyondTheCode />
      <Education />
      <Contact />
    </main>
    <footer className="site-footer"><span>© 2026 Beebek Sharma</span><span>Built with React / systems-minded</span><a href="#top">Back to top ↑</a></footer>
  </div>
}

export default App
