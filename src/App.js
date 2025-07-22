import logo from './logo.png';
import './App.css';
import FileUploader from './FileUploader';
import { supabase } from './utils/supabase';

function App() {

  return (
    <div className="App">
      <header className="App-header">
        <img src={logo} style={{ width: '250px', height: '250px' }} alt="logo" />
      </header>
      <div>
        <FileUploader />
      </div>
    </div>
  );
}

export default App;