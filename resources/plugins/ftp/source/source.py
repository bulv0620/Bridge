import multiprocessing
multiprocessing.freeze_support()

import os
import json
from pyftpdlib.handlers import FTPHandler
from pyftpdlib.servers import FTPServer
from pyftpdlib.authorizers import DummyAuthorizer
from datetime import datetime

class CustomHandler(FTPHandler):
    def ftp_MFMT(self, args, timeval):
        try:
            time_str, filepath = timeval, args
            dt = datetime.strptime(time_str, "%Y%m%d%H%M%S.%f")
            timestamp = dt.timestamp()
            abs_path = self.fs.realpath(filepath)
            os.utime(abs_path, (timestamp, timestamp))
            self.respond(f"213 Modify Time={time_str}; {filepath}")
        except ValueError:
            self.respond("550 Invalid parameter format. Correct format: MFMT <timestamp> <filepath>")
        except FileNotFoundError:
            self.respond("550 File not found")
        except Exception as e:
            self.respond(f"550 Error: {str(e)}")

# Load JSON configuration file
def load_config():
    try:
        with open('config.json', 'r') as f:
            config = json.load(f)
        return config
    except FileNotFoundError:
        raise Exception("Configuration file config.json not found")
    except json.JSONDecodeError:
        raise Exception("Invalid configuration file format")

def main():
    # Load configuration
    config = load_config()

    # Create authorizer
    authorizer = DummyAuthorizer()

    # Add multiple users
    for user in config["USERS"]:
        home_dir = user["HOME"]

        # Ensure user home directory exists
        if not os.path.exists(home_dir):
            os.makedirs(home_dir, exist_ok=True)
            print(f"Created user directory: {home_dir}")

        # Add user (full permissions)
        authorizer.add_user(
            user["USERNAME"],
            user["PASSWORD"],
            home_dir,
            perm="elradfmwMT"  # All permissions
        )

    # Configure FTP handler
    handler = CustomHandler
    handler.authorizer = authorizer
    handler.masquerade_address = config["FTP_HOST"]
    handler.passive_ports = list(range(config["PASV_PORTS"][0], config["PASV_PORTS"][1] + 1))

    # Start server
    server = FTPServer((config["FTP_HOST"], config["FTP_PORT"]), handler)
    server.serve_forever(timeout=1)

# Main program
if __name__ == "__main__":
    main()
