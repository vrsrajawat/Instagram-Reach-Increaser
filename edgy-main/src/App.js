import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
//Components
import moment from "moment";
import Navigation from "./components/navigation/Navigation";
import Landing from "./routes/landing/Landing";
import Footer from "./components/footer/Footer";
import Contact from "./routes/contact/Contact";
import Pricing from "./routes/pricing/Pricing";
import Faq from "./routes/faq/Faq";
import Blog from "./routes/blog/Blog";
import About from "./routes/about/About";
import Terms from "./routes/terms/Terms";
import Refunds from "./routes/refunds/Refunds";
import Privacy from "./routes/privacy/Privacy";
import Jobs from "./routes/jobs/Jobs";
import SignIn from "./routes/sign-in/SignIn";
import SignUp from "./routes/sign-up/SignUp";
import BlogPost from "./routes/blog-post/BlogPost";
//Airtable
import edgyBase from "./airtable/airtable";
import { useEffect, useState } from "react";
//uuid
import { v4 as uuidv4 } from 'uuid';
import Profile from "./routes/user-profile/Profile";
import NotFound from "./components/NotFound";



export default function App() {
  const [user, setUser] = useState(null)
  const [loggedIn, setLoggedIn] = useState(false);
  const [triggeredLogout, setTriggeredLogout] = useState(false);

  useEffect(() => {
    if (loggedIn && sessionStorage.getItem('loggedIn') === null && !triggeredLogout) {
      sessionStorage.setItem('loggedIn', 'true');
    }
    if (triggeredLogout && sessionStorage.getItem('loggedIn') !== null) {
      sessionStorage.removeItem('loggedIn');
      sessionStorage.removeItem('user');
    }
    if (sessionStorage.getItem('loggedIn') !== null && !triggeredLogout) {
      setLoggedIn(true);
      const jsonUser = sessionStorage.getItem('user');
      if (jsonUser) {
        setUser(JSON.parse(jsonUser));
      }
    }
  }, [loggedIn, triggeredLogout]);
  
  useEffect(() => {
    const jsonUser = sessionStorage.getItem('user');
    if (jsonUser) {
      const userData = JSON.parse(jsonUser);
      setUser(userData);
      setLoggedIn(true);
    }
  }, []);
  
  const findUserByEmail = (records, email) => records.find(record => record.fields.email === email);

  const retrieveDatabase = async (email, password = undefined) => {
    try {
      const response = await fetch(process.env.REACT_APP_AIRTABLE_SERVER_URL);
      const data = await response.json();
      if (data) {

        const userByEmail = findUserByEmail(data.records, email);
        if (userByEmail) {
           // Check if the user is already logged in
        if (loggedIn && userByEmail.fields.email === user.email) {
          // User is already logged in, no need to update
          return true;
        }
          if (userByEmail.fields.password === password) { 
            const userData = { 
              id: userByEmail.id, 
              createdTime: moment(userByEmail.createdTime).utc().format('YYYY-MM-DD'), 
              email: userByEmail.fields.email, 
              fullname: userByEmail.fields.fullname, 
              gender: userByEmail.fields.gender, 
              plan: userByEmail.fields.plan, 
              password: userByEmail.fields.password 
            };
            
            setUser(userData);
            
            // Save user data in sessionStorage
            sessionStorage.setItem('user', JSON.stringify(userData));
            
      
          return true;
          }
        }
        return false;
        
      }

    }
    catch (err) {
      return false;
    }
  }

  const registerUser = async (data) => {
    const { email, password, fullname } = data;
    const id = uuidv4();
    const checkUser = await retrieveDatabase(data.email.toLowerCase());

    if (checkUser) {
      return false;
    }
    if (checkUser === false) {
      try {
        edgyBase('users').create([
          {
            "fields": {
              "id": id,
              "email": email.toLowerCase(),
              "password": password,
              "fullname": fullname,
            }
          },
        ]
        );
        return true;
      }
      catch (error) {
        console.error(error);
      }
    }

  }

  const updateUser = (userId, formValue) => {
    //destructure incoming data from
    const key = Object.keys(formValue)[0];
    const value = Object.values(formValue)[0];
    const form = {
      [key]: value,
    }
    //Update the  user info
    edgyBase('users').update([
      {
        "id": userId,
        "fields": form
      }
    ]
      , function (error) {
        if (error) {
          console.log(`Message: ${error.message} | Code: ${error.statusCode}`);
          return;
        }
        else {
          return true;
        }
      }

    );
    setUser({ ...user, [key]: value });
    sessionStorage.setItem('user', JSON.stringify({ ...user, [key]: value }));
  }




  const deleteUser = (userId) => {
    edgyBase('users').destroy([userId], function (err, deletedRecords) {
      if (err) {
        console.error(err);
        return;
      }
    });
    setLoggedIn(false);
  }

  return (
    <Router>
      <Navigation loggedIn={loggedIn} setLoggedIn={setLoggedIn} setTriggeredLogout={setTriggeredLogout} />
      <Routes>
        <Route path="/" element={<Landing loggedIn={loggedIn} />} />
        <Route path="/contact" element={<Contact />} />
        <Route path="/pricing" element={<Pricing loggedIn={loggedIn} />} />
        <Route path="/faq" element={<Faq />} />
        <Route path="/blog" element={<Blog />} />
        <Route path="/blog/:name" element={<BlogPost />} />
        <Route path="/about" element={<About />} />
        <Route path="/terms" element={<Terms />} />
        <Route path="/refunds" element={<Refunds />} />
        <Route path="/privacy" element={<Privacy />} />
        <Route path="/jobs" element={<Jobs />} />
        <Route path="/sign-in" element={loggedIn ? <Profile retrieveDatabase={retrieveDatabase} user={user} updateUser={updateUser} deleteUser={deleteUser} setLoggedIn={setLoggedIn} setTriggeredLogout={setTriggeredLogout} /> : <SignIn retrieveDatabase={retrieveDatabase} user={user} setLoggedIn={setLoggedIn} />} />
        <Route path="/sign-up" element={loggedIn ? <Profile retrieveDatabase={retrieveDatabase} user={user} updateUser={updateUser} deleteUser={deleteUser} setLoggedIn={setLoggedIn} setTriggeredLogout={setTriggeredLogout} /> : <SignUp retrieveDatabase={retrieveDatabase} user={user} registerUser={registerUser} />} />
        <Route path="/profile" element={loggedIn ? <Profile retrieveDatabase={retrieveDatabase} user={user} updateUser={updateUser} deleteUser={deleteUser} setLoggedIn={setLoggedIn} setTriggeredLogout={setTriggeredLogout} /> : <NotFound />} />
        <Route path='*' element={<NotFound />} />
      </Routes>
      <Footer />
    </Router>
  )
}