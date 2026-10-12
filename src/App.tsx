import { Header } from './components'
import { AvatarCompanion } from './components/avatar/AvatarCompanion'
import { ViralHeroAvatar } from './components/avatar/ViralHeroAvatar'
import { About, BeyondTheCode, Contact, Experience, Hero, SelectedWork, SiteFooter, WhatIBuild } from './sections'
import './styles.css'

function App() {
  return (
    <div className="site">
      <Header />
      <main id="main-content">
        <Hero />
        <WhatIBuild />
        <SelectedWork />
        <Experience />
        <About />
        <BeyondTheCode />
        <Contact />
      </main>
      <SiteFooter />
      <ViralHeroAvatar />
      <AvatarCompanion />
    </div>
  )
}

export default App
