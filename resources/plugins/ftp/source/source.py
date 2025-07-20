import multiprocessing
multiprocessing.freeze_support()

import os
import json
import logging
from pyftpdlib.handlers import FTPHandler
from pyftpdlib.servers import FTPServer
from pyftpdlib.authorizers import DummyAuthorizer
from datetime import datetime

# Configure logging: output to ftp_server.log, overwrite on each start
LOG_FILE = '.log'
logging.basicConfig(
    filename=LOG_FILE,
    filemode='w',  # overwrite log on each startup
    level=logging.INFO,
    format='%(asctime)s [%(levelname)s] %(message)s',
    datefmt='%Y-%m-%d %H:%M:%S'
)

class CustomHandler(FTPHandler):
    def ftp_MFMT(self, args, timeval):
        try:
            time_str, filepath = timeval, args
            dt = datetime.strptime(time_str, "%Y%m%d%H%M%S.%f")
            timestamp = dt.timestamp()
            abs_path = self.fs.realpath(filepath)
            os.utime(abs_path, (timestamp, timestamp))
            self.respond(f"213 Modify Time={time_str}; {filepath}")
            logging.info(f"MFMT successful: {filepath} -> {time_str}")
        except ValueError:
            self.respond("550 Invalid parameter format. Correct format: MFMT <timestamp> <filepath>")
            logging.warning(f"MFMT invalid format: args={args}, timeval={timeval}")
        except FileNotFoundError:
            self.respond("550 File not found")
            logging.error(f"MFMT file not found: {filepath}")
        except Exception as e:
            self.respond(f"550 Error: {str(e)}")
            logging.exception(f"MFMT error for {filepath}")

# Load JSON configuration file
def load_config():
    try:
        with open('config.json', 'r') as f:
            config = json.load(f)
        logging.info('Configuration loaded successfully')
        return config
    except FileNotFoundError:
        logging.critical('Configuration file config.json not found')
        raise
    except json.JSONDecodeError:
        logging.critical('Invalid configuration file format')
        raise


def main():
    logging.info('Starting FTP server')
    # Load configuration
    config = load_config()

    # Create authorizer
    authorizer = DummyAuthorizer()

    # Add multiple users
    for user in config.get("USERS", []):
        home_dir = user["HOME"]

        # Ensure user home directory exists
        if not os.path.exists(home_dir):
            os.makedirs(home_dir, exist_ok=True)
            logging.info(f"Created user directory: {home_dir}")

        # Add user (full permissions)
        authorizer.add_user(
            user["USERNAME"],
            user["PASSWORD"],
            home_dir,
            perm="elradfmwMT"  # All permissions
        )
        logging.info(f"Added FTP user: {user['USERNAME']}")

    # Configure FTP handler
    handler = CustomHandler
    handler.authorizer = authorizer
    handler.masquerade_address = config.get("FTP_HOST")
    handler.passive_ports = list(range(
        config.get("PASV_PORTS", [])[0],
        config.get("PASV_PORTS", [])[1] + 1
    ))

    # Start server
    address = (config.get("FTP_HOST"), config.get("FTP_PORT"))
    server = FTPServer(address, handler)
    logging.info(f"FTP server listening on {address[0]}:{address[1]}")
    try:
        server.serve_forever(timeout=1)
    except KeyboardInterrupt:
        logging.info('FTP server shutdown requested by user')
    finally:
        server.close_all()
        logging.info('FTP server stopped')

# Main program
if __name__ == "__main__":
    main()
