``` bash
1. state-bootstrap init
2. state-bootstrap apply   # tạo S3 bucket lưu state
3. make infra-init         # init Terraform hạ tầng app, dùng bucket vừa tạo
4. terraform plan          # xem các thay đổi dự kiến
5. terraform apply         # tạo hạ tầng app
```