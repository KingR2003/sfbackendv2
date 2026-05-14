import express from 'express';
import { createProxyMiddleware } from 'http-proxy-middleware';

const app = express();
app.use('/api', createProxyMiddleware({
    target: 'http://15.206.163.52',
    changeOrigin: true,
    secure: false,
    headers: {
        "ngrok-skip-browser-warning": "true",
    },
    onError: (err, req, res) => {
        console.error("Proxy error:", err.message);
        res.writeHead(502, {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
        });
        res.end(JSON.stringify({ message: "Upstream server is currently unreachable. Please try again." }));
    },
    onProxyRes: function (proxyRes, req, res) {
        let body = [];
        proxyRes.on('data', function (chunk) { body.push(chunk); });
        proxyRes.on('end', function () {
            try {
                const fullBody = Buffer.concat(body).toString('utf8');
                console.log("===============================");
                console.log(`[${req.method}] ${req.url}`);
                console.log(`STATUS: ${proxyRes.statusCode}`);
                if (req.url.includes("order")) {
                    console.log(`RESPONSE:`, fullBody.slice(0, 2000));
                }
            } catch (e) {
                console.error("Proxy parsing error:", e);
            }
        });
    }
}));

app.listen(9999, () => {
    console.log("Logging proxy listening on port 9999, connected to 15.206.163.52");
});
