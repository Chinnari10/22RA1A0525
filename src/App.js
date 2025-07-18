import React, { useState } from 'react';
import {
  BrowserRouter as Router,
  Routes,
  Route,
  useNavigate,
  useParams,
} from 'react-router-dom';
import {
  Container,
  TextField,
  Button,
  Typography,
  Grid,
  Box,
  Paper,
  CssBaseline,
  AppBar,
  Toolbar,
} from '@mui/material';
import { v4 as uuidv4 } from 'uuid';

// Logger Middleware (optional)
const logger = (message) => {
  window.localStorage.setItem(`log-${Date.now()}`, JSON.stringify(message));
};

const isValidURL = (url) => {
  try {
    new URL(url);
    return true;
  } catch (_) {
    return false;
  }
};

const generateShortCode = () => uuidv4().slice(0, 6);

const getShortUrlStorage = () =>
  JSON.parse(localStorage.getItem('shortUrls') || '{}');

const saveShortUrlStorage = (data) => {
  localStorage.setItem('shortUrls', JSON.stringify(data));
};

const Home = () => {
  const [urls, setUrls] = useState(['']);
  const [results, setResults] = useState([]);
  const [validities, setValidities] = useState(['']);
  const [shortcodes, setShortcodes] = useState(['']);

  const handleShorten = () => {
    let shortUrlStorage = getShortUrlStorage();

    const newResults = urls.map((url, idx) => {
      const customCode = shortcodes[idx]?.trim();
      const validity = parseInt(validities[idx]) || 30;

      if (!isValidURL(url)) {
        logger({ type: 'error', message: 'Invalid URL', url });
        return { error: 'Invalid URL' };
      }

      let code = customCode || generateShortCode();

      if (shortUrlStorage[code]) {
        logger({ type: 'error', message: 'Shortcode already exists', code });
        return { error: 'Shortcode already exists' };
      }

      shortUrlStorage[code] = {
        longUrl: url,
        created: new Date(),
        clicks: [],
        expires: new Date(Date.now() + validity * 60 * 1000),
      };

      logger({ type: 'info', message: 'URL shortened', url, code });
      return { code, longUrl: url };
    });

    saveShortUrlStorage(shortUrlStorage);
    setResults(newResults);
  };

  const updateArray = (setter, index, value) => {
    setter((prev) => {
      const updated = [...prev];
      updated[index] = value;
      return updated;
    });
  };

  const addInputField = () => {
    if (urls.length >= 5) return;
    setUrls([...urls, '']);
    setValidities([...validities, '']);
    setShortcodes([...shortcodes, '']);
  };

  return (
    <Container maxWidth="md">
      <CssBaseline />
      <AppBar position="static">
        <Toolbar>
          <Typography variant="h6">React URL Shortener</Typography>
        </Toolbar>
      </AppBar>
      <Box mt={4}>
        <Typography variant="h4" gutterBottom>
          Shorten Your URLs
        </Typography>
        {urls.map((url, idx) => (
          <Paper elevation={3} sx={{ padding: 2, marginBottom: 2 }} key={idx}>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Original URL"
                  value={url}
                  onChange={(e) => updateArray(setUrls, idx, e.target.value)}
                />
              </Grid>
              <Grid item xs={6} sm={3}>
                <TextField
                  fullWidth
                  label="Validity (mins)"
                  type="number"
                  value={validities[idx]}
                  onChange={(e) => updateArray(setValidities, idx, e.target.value)}
                />
              </Grid>
              <Grid item xs={6} sm={3}>
                <TextField
                  fullWidth
                  label="Custom Shortcode"
                  value={shortcodes[idx]}
                  onChange={(e) => updateArray(setShortcodes, idx, e.target.value)}
                />
              </Grid>
            </Grid>
          </Paper>
        ))}
        <Box display="flex" gap={2} mb={2}>
          <Button variant="contained" onClick={handleShorten}>
            Shorten URLs
          </Button>
          <Button
            variant="outlined"
            onClick={addInputField}
            disabled={urls.length >= 5}
          >
            Add More
          </Button>
        </Box>
        {results.map((res, idx) =>
          res.error ? (
            <Typography color="error" key={idx}>
              {res.error}
            </Typography>
          ) : (
            <Paper key={idx} elevation={2} sx={{ padding: 2, marginBottom: 1 }}>
              <Typography>Original: {res.longUrl}</Typography>
              <Typography>
                Short:{' '}
                <a href={`/${res.code}`}>{`http://localhost:3000/${res.code}`}</a>
              </Typography>
            </Paper>
          )
        )}
      </Box>
    </Container>
  );
};

const RedirectHandler = () => {
  const { code } = useParams();
  const shortUrlStorage = getShortUrlStorage();
  const entry = shortUrlStorage[code];

  if (!entry) {
    return (
      <Container>
        <Typography color="error" variant="h5" mt={5}>
          Shortcode not found.
        </Typography>
      </Container>
    );
  }

  if (new Date() > new Date(entry.expires)) {
    return (
      <Container>
        <Typography color="error" variant="h5" mt={5}>
          This link has expired.
        </Typography>
      </Container>
    );
  }

  entry.clicks.push({
    timestamp: new Date(),
    source: document.referrer || 'localhost',
    location: 'IN',
  });

  shortUrlStorage[code] = entry;
  saveShortUrlStorage(shortUrlStorage);

  window.location.href = entry.longUrl;
  return (
    <Container>
      <Typography variant="h6" mt={5}>
        Redirecting...
      </Typography>
    </Container>
  );
};

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/:code" element={<RedirectHandler />} />
      </Routes>
    </Router>
  );
}
