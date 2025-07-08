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
            self.respond("550 参数格式错误，正确格式：MFMT <时间戳> <文件路径>")
        except FileNotFoundError:
            self.respond("550 文件不存在")
        except Exception as e:
            self.respond(f"550 错误：{str(e)}")

# 读取JSON配置文件
def load_config():
    try:
        with open('config.json', 'r') as f:
            config = json.load(f)
        return config
    except FileNotFoundError:
        raise Exception("配置文件 config.json 不存在")
    except json.JSONDecodeError:
        raise Exception("配置文件格式错误")

# 主程序
if __name__ == "__main__":
    # 加载配置
    config = load_config()
    
    # 创建授权器
    authorizer = DummyAuthorizer()
    
    # 添加多用户
    for user in config["USERS"]:
        home_dir = user["HOME"]
        
        # 确保用户主目录存在
        if not os.path.exists(home_dir):
            os.makedirs(home_dir, exist_ok=True)
            print(f"创建用户目录: {home_dir}")
        
        # 添加用户（完全权限）
        authorizer.add_user(
            user["USERNAME"],
            user["PASSWORD"],
            home_dir,
            perm="elradfmwMT"  # 所有权限
        )
        print(f"添加用户: {user['USERNAME']}，主目录: {home_dir}")
    
    # 配置FTP处理器
    handler = CustomHandler
    handler.authorizer = authorizer
    handler.masquerade_address = config["FTP_HOST"]
    handler.passive_ports = list(range(config["PASV_PORTS"][0], config["PASV_PORTS"][1] + 1))
    
    # 启动服务器
    server = FTPServer((config["FTP_HOST"], config["FTP_PORT"]), handler)
    print(f"\nFTP服务器已启动: ftp://{config['FTP_HOST']}:{config['FTP_PORT']}")
    print(f"被动端口范围: {config['PASV_PORTS'][0]}-{config['PASV_PORTS'][1]}")
    print("按Ctrl+C停止服务器")
    server.serve_forever(timeout=1)