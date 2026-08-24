async function run() {
  try {
    const res = await fetch('https://ep-young-shadow-aylpw2u0.c-5.us-east-2.aws.neon.tech/v2', { method: 'OPTIONS' });
    console.log('Google status:', res.status);
  } catch (err) {
    console.error('Fetch error:', err);
  }
}
run();
