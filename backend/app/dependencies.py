from fastapi import Header, HTTPException, Depends

def get_current_role(x_role: str = Header(default="uploader", alias="X-Role")):
    if x_role not in ["uploader", "admin"]:
        raise HTTPException(status_code=400, detail="Invalid role header. Must be 'uploader' or 'admin'")
    return x_role

def require_admin(role: str = Depends(get_current_role)):
    if role != "admin":
        raise HTTPException(status_code=403, detail="Admin privileges required")
    return role
