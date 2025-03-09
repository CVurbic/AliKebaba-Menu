import Jelovnik from "./components/Jelovnik.js"
import { LanguageProvider } from './context/LanguageContext';

function App(){

return(
  <LanguageProvider>
  <Jelovnik/>
  </LanguageProvider>
)

}export default App