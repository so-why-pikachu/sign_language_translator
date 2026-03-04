import Header from './pages/home/components/Header';
import Home from './pages/home/home.tsx';
import About from './pages/about/about.tsx'
import {BrowserRouter, Route, Routes, useLocation} from "react-router-dom";
import {useEffect} from "react";

const BackgroundController = () => {
    const location = useLocation();

    useEffect(() => {
        document.body.classList.remove('bg-gradient', 'bg-home');

        switch (location.pathname) {
            case '/about':
                document.body.classList.add('bg-gradient');
                break;
            case '/':
                document.body.classList.add('bg-home');
                break;
        }
    }, [location.pathname]);

    return null;
};

function App() {
    return (
        <BrowserRouter>
            <BackgroundController />
            <div className="app-wrapper">
                <Header />

                    <Routes>
                        <Route path="/" element={<Home />} />
                        <Route path="/about" element={<About />} />
                    </Routes>
            </div>
        </BrowserRouter>
    );
}

export default App;