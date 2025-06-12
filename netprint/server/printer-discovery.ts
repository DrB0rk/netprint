import dgram from 'dgram';
import { networkInterfaces } from 'os';
import { Socket } from 'net';

interface PrinterInfo {
    name: string;
    uri: string;
}

export async function discoverPrinters(): Promise<PrinterInfo[]> {
    const printers: PrinterInfo[] = [];
    const ports = [631]; // Common printer ports (IPP and Raw)
    
    // Get all IPv4 addresses of the machine
    const nets = networkInterfaces();
    const addresses: string[] = [];
    
    for (const name of Object.keys(nets)) {
        const interfaces = nets[name];
        if (interfaces) {
            for (const net of interfaces) {
                // Skip over non-IPv4 and internal addresses
                if (net.family === 'IPv4' && !net.internal) {
                    addresses.push(net.address);
                }
            }
        }
    }

    // Get the subnet to scan (e.g., if IP is 192.168.1.100, scan 192.168.1.*)
    const subnets = addresses.map(addr => addr.split('.').slice(0, 3).join('.'));

    const scanPromises: Promise<void>[] = [];

    for (const subnet of subnets) {
        for (let i = 1; i < 255; i++) {
            const ip = `${subnet}.${i}`;
            for (const port of ports) {
                scanPromises.push(
                    checkIPPPrinter(ip, port)
                        .then(result => {
                            if (result) {
                                printers.push({
                                    name: `Printer at ${ip}:${port}`,
                                    uri: `ipp://${ip}:${port}/ipp/print`
                                });
                            }
                        })
                        .catch(() => {/* ignore errors */})
                );
            }
        }
    }

    // Wait for all scans to complete with a timeout
    await Promise.race([
        Promise.all(scanPromises),
        new Promise(resolve => setTimeout(resolve, 5000)) // 5 second timeout
    ]);

    return printers;
}

function checkIPPPrinter(ip: string, port: number): Promise<boolean> {
    return new Promise((resolve) => {
        const socket = new Socket();
        const timeout = 200; // 200ms timeout per connection attempt

        socket.setTimeout(timeout);

        socket.on('connect', () => {
            socket.destroy();
            resolve(true);
        });

        socket.on('timeout', () => {
            socket.destroy();
            resolve(false);
        });

        socket.on('error', () => {
            socket.destroy();
            resolve(false);
        });

        socket.connect(port, ip);
    });
}
