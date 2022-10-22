# Try.jl

```@docs
Try
```

## Result value manipulation API

```@docs
Ok
Err
Try.isok
Try.iserr
Try.unwrap
Try.unwrap_err
Try.oktype
Try.errtype
Try.map
Try.astuple
```

## Short-circuit evaluation

```@docs
@?
Try.@and_return
Try.@return
Try.or_else
Try.and_then
Try.@or
Try.@and
Try.or
Try.and
```

See also: [Customizing short-circuit evaluation](@ref customize-short-circuit).

## Debugging interface (error traces)

```@docs
Try.enable_errortrace
Try.disable_errortrace
```
